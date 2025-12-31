import { createCodeWorker, publisherClient, connection as redis } from "@repo/queue";
import { Judge0Service, Judge0Submission } from "../services/judge0.service";
import { SUBMISSIONS_PREFIX, MATCH_TTL } from "../utils/constants";

export function initJudge0Worker() {
  console.log("Initializing Judge0 Worker in Server...");
  
  createCodeWorker(async (job) => {
    const { code, language, testcases, submissionId, matchId, userId, questionId } = job.data;
    if (!code || !language || !testcases) throw new Error("Missing data");

    console.log(`Processing submission ${submissionId} for user ${userId} using Judge0`);

    const langId = Judge0Service.getLanguageId(language);
    const submissions: Judge0Submission[] = testcases.map((tc: any) => ({
      source_code: code,
      language_id: langId,
      stdin: tc.input || "",
      expected_output: tc.expected_output || "",
    }));

    try {
      const startTime = Date.now();
      const tokens = await Judge0Service.submitBatch(submissions);
      const results = await Judge0Service.getBatchResults(tokens);
      const endTime = Date.now();

      const detailedResults = results.map((res, i) => {
        const passed = res.status.id === 3; // 3: Accepted
        return {
          input: testcases[i]?.input || "",
          expected: testcases[i]?.expected_output || "",
          output: res.stdout || res.stderr || res.compile_output || res.message || "",
          passed,
        };
      });

      const passedCount = detailedResults.filter((r) => r.passed).length;
      const total = testcases.length;

      const summaryResult = {
        passed: passedCount === total,
        passedCount,
        total,
        timeMs: endTime - startTime,
      };

      const subHashKey = `${SUBMISSIONS_PREFIX}${matchId ? matchId : "practice"}:${userId}`;
      const stored = await redis.hget(subHashKey, submissionId);
      
      if (stored) {
        const s = JSON.parse(stored);
        s.status = "DONE";
        s.result = summaryResult;
        s.detailedResults = detailedResults;
        await redis.hset(subHashKey, submissionId, JSON.stringify(s));
        await redis.expire(subHashKey, MATCH_TTL);
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
      console.error("Error during Judge0 execution:", err);
      return {
        passed: false,
        passedCount: 0,
        total: testcases.length,
        timeMs: 0,
        error: String(err),
      };
    }
  });
}
