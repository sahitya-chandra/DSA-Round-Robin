import { createCodeWorker, publisherClient, connection as redis } from "@repo/queue";
import { parseError } from "../utils/errorParser";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });
const SUBMISSIONS_PREFIX = "match_submissions:";

createCodeWorker(async (job) => {
  const { code, language, testcases, submissionId, matchId, userId, questionId } = job.data;
  if (!code || !language || !testcases) throw new Error("Missing data");

  const tempDir = path.join(String(process.env.HOME_DIR), "docker_temp", `job-${job.id}`);
  await fs.mkdir(tempDir, { recursive: true });

  console.log("Mount directory:", tempDir);

  const fileExtMap: Record<string, string> = { cpp: "cpp", python: "py", javascript: "js" };
  const dockerImageMap: Record<string, string> = { 
    cpp: "gcc:latest", 
    python: "python:3.11-alpine", 
    javascript: "node:18-alpine" 
  };

  const fileExt = fileExtMap[language];
  const dockerImage = dockerImageMap[language];
  if (!fileExt || !dockerImage) throw new Error(`Unsupported language: ${language}`);

  const sourceFilename = `main.${fileExt}`;
  const filePath = path.join(tempDir, sourceFilename);
  await fs.writeFile(filePath, code);

  for (let i = 0; i < testcases.length; i++) {
    const input = testcases[i]?.input || "";
    await fs.writeFile(path.join(tempDir, `input_${i}.txt`), input);
  }

  console.log(`Source file created at: ${filePath}`);

let runCmd = "";

  if (language === "cpp") {
    runCmd = `g++ /code/${sourceFilename} -o /code/main && `;
    runCmd += `i=0; while [ \\$i -lt ${testcases.length} ]; do /code/main < /code/input_\\$i.txt > /code/output_\\$i.txt; i=\\$((i+1)); done`;
  } else if (language === "python") {
    runCmd = `i=0; while [ \\$i -lt ${testcases.length} ]; do python /code/${sourceFilename} < /code/input_\\$i.txt > /code/output_\\$i.txt; i=\\$((i+1)); done`;
  } else if (language === "javascript") {
    runCmd = `i=0; while [ \\$i -lt ${testcases.length} ]; do node /code/${sourceFilename} < /code/input_\\$i.txt > /code/output_\\$i.txt; i=\\$((i+1)); done`;
  }

  const dockerCmd = `docker run --rm --init -i -v ${tempDir}:/code --memory=128m --cpus=0.5 --network none ${dockerImage} sh -c "${runCmd}"`;

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
    let dockerStderr = "";
    console.log("Executing batch docker command...");
    await new Promise<void>((resolve, reject) => {
      exec(dockerCmd, { timeout: 10000 }, (err, stdout, stderr) => {
        dockerStderr = stderr;
        if (err) {
          console.error("Docker execution failed:", stderr);
        }
        resolve();
      });
    });

    for (let i = 0; i < total; i++) {
      const tc = testcases[i];
      if (!tc) continue;

      const expected = (tc.expected_output || "").trim();
      let output = "";
      try {
        output = (await fs.readFile(path.join(tempDir, `output_${i}.txt`), "utf-8")).trim();
      } catch (e) {
        const parsed = parseError(dockerStderr, language);
        output = `Error: ${parsed.type}${parsed.line ? ` (Line ${parsed.line})` : ""}\n${parsed.message}`;
      }

      const passed = output === expected;
      if (passed) passedCount++;

      detailedResults.push({
        input: tc.input || "",
        expected,
        output,
        passed,
      });
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
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log("Cleaned up temp directory:", tempDir);
    } catch (e) {
      console.warn("Failed to cleanup temp directory:", tempDir);
    }
  }
});