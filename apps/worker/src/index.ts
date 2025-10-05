import { createCodeWorker } from "@repo/queue";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

createCodeWorker(async (job) => {
  const { code, language, testcases } = job.data;
  if (!code || !language || !testcases) throw new Error("Missing data");

  const tempDir = path.join(String(process.env.HOME_DIR), "docker_temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  console.log("Mount directory:", tempDir);

  const fileExtMap: Record<string, string> = { cpp: "cpp", python: "py", javascript: "js" };
  const dockerImageMap: Record<string, string> = { cpp: "gcc:latest", python: "python:3.11", javascript: "node:18" };

  const fileExt = fileExtMap[language];
  const dockerImage = dockerImageMap[language];
  if (!fileExt || !dockerImage) throw new Error(`Unsupported language: ${language}`);

  const filePath = path.join(tempDir, `job-${job.id}.${fileExt}`);
  fs.writeFileSync(filePath, code);

  console.log(`Source file created at: ${filePath}`);

  const runCmdMap: Record<string, string> = {
    cpp: `g++ /code/job-${job.id}.cpp -o /code/main && /code/main`,
    python: `python /code/job-${job.id}.py`,
    javascript: `node /code/job-${job.id}.js`,
  };

  const dockerBase = `docker run --rm -i -v ${tempDir}:/code --memory=128m --cpus=0.5 ${dockerImage} bash -c`;

  const results: {
    input: string;
    expected: string;
    output: string;
    passed: boolean;
  }[] = [];

  try {
    for (const [i, tc] of testcases.entries()) {
      console.log(`\n--- Running testcase ${i + 1} ---`);
      console.log("Input:", JSON.stringify(tc.input));

      const dockerCmd = `${dockerBase} "${runCmdMap[language]}"`;

      const output = await new Promise<string>((resolve, reject) => {
        const proc = exec(dockerCmd, { timeout: 5000 }, (err, stdout, stderr) => {
          console.log("STDOUT:", stdout);
          console.log("STDERR:", stderr);
          if (err) return reject(stderr || err.message);
          resolve(stdout.trim());
        });

        if (proc.stdin) {
          proc.stdin.write(tc.input);
          proc.stdin.end()
        }
      });

      const cleanedOutput = output.trim();
      const expected = tc.expected_output.trim();

      const passed = cleanedOutput === expected;
      console.log("Expected:", JSON.stringify(expected));
      console.log("Got     :", JSON.stringify(cleanedOutput));
      console.log("Passed? :", passed);

      results.push({
        input: tc.input,
        expected,
        output: cleanedOutput,
        passed,
      });
    }

    return results;
  } catch (err) {
    console.error("Error during execution:", err);
    return testcases.map(tc => ({
      input: tc.input,
      expected: tc.expected_output,
      output: String(err),
      passed: false,
    }));
  } finally {
    try {
      fs.unlinkSync(filePath);
      console.log("Deleted temp file:", filePath);
    } catch (e) {
      console.warn("Failed to delete temp file:", filePath);
    }
  }
});
