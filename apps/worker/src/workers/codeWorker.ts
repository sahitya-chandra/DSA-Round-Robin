import { createCodeWorker, publisherClient, connection as redis } from "@repo/queue";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });
const SUBMISSIONS_PREFIX = "match_submissions:";

createCodeWorker(async (job) => {
  const { code, language, testcases, submissionId, matchId, userId, questionId } = job.data;
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

  const dockerBase = `docker run --rm -i -v ${tempDir}:/code --memory=128m --cpus=0.5 --log-opt max-size=10m --log-opt max-file=3 ${dockerImage} bash -c`;

  const detailedResults: {
    input: string;
    expected: string;
    output: string;
    passed: boolean;
  }[] = [];

  let passedCount = 0;
  const total = testcases.length;
  const startTime = Date.now();

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
          proc.stdin.end();
        }
      });

      const cleanedOutput = output.trim();
      const expected = tc.expected_output.trim();
      const passed = cleanedOutput === expected;

      if (passed) passedCount++;

      detailedResults.push({
        input: tc.input,
        expected,
        output: cleanedOutput,
        passed,
      });

      console.log("Expected:", JSON.stringify(expected));
      console.log("Got     :", JSON.stringify(cleanedOutput));
      console.log("Passed? :", passed);
    }

    const endTime = Date.now();
    const timeMs = endTime - startTime;

    const summaryResult = {
      passed: passedCount === total,
      passedCount,
      total,
      timeMs,
    };

    const subHashKey = `${SUBMISSIONS_PREFIX}${matchId}:${userId}`;
    const stored = await redis.hget(subHashKey, submissionId);
    if (stored) {
      const s = JSON.parse(stored);
      s.status = "DONE";
      s.result = summaryResult;
      s.detailedResults = detailedResults;
      await redis.hset(subHashKey, submissionId, JSON.stringify(s));
    }

    publisherClient.publish("match_events", JSON.stringify({
      event: "submission_result",
      data: {
        matchId,
        userId,
        submissionId,
        questionId,
        result: summaryResult,
        details: detailedResults,
      },
    }));

    return summaryResult;
  } catch (err) {
    console.error("Error during execution:", err);
    return {
      passed: false,
      passedCount: 0,
      total: testcases.length,
      timeMs: 0,
      error: String(err),
    };
  } finally {
    try {
      fs.unlinkSync(filePath);
      console.log("Deleted temp file:", filePath);
    } catch (e) {
      console.warn("Failed to delete temp file:", filePath);
    }
  }
});
