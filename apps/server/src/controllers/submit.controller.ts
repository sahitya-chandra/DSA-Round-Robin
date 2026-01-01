import { Response } from "express";
import { connection as redis, codeQueue } from "@repo/queue";
import { v4 as uuidv4 } from "uuid";
import { AuthRequest } from "../types/types";
import { ACTIVE_MATCH_PREFIX, MATCH_TTL, SUBMISSIONS_PREFIX } from "../utils/constants";

export const submitMatchController = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { matchId, questionId, code, language } = req.body;
  const safeMatchId = decodeURIComponent(matchId);
  if (!userId) return res.status(401).json({ error: "unauthenticated" });
  if (!safeMatchId || !questionId || !code) return res.status(400).json({ error: "bad request" });

  const ALLOWED_LANGS = ["cpp", "python", "javascript"] as const;
  const lang = ALLOWED_LANGS.includes(language as any) ? language : "cpp";

  try {
    const raw = await redis.hgetall(`${ACTIVE_MATCH_PREFIX}${safeMatchId}`);
    if (!raw || raw.status !== "RUNNING") return res.status(400).json({ error: "match not running" });

    if (raw.requesterId !== userId && raw.opponentId !== userId) {
      return res.status(403).json({ error: "not a participant" });
    }

    const questions = raw.questions ? JSON.parse(raw.questions) : [];
    const qObj = questions.find((q: any) => q.questionData.id === Number(questionId));
    if (!qObj) return res.status(400).json({ error: "question not in match" });

    const submissionId = uuidv4();
    const createdAt = new Date().toISOString();

    const submission = {
      id: submissionId,
      userId,
      questionId: Number(questionId),
      code,
      language: lang || "cpp",
      createdAt,
      status: "PENDING",
      result: null,
    };

    console.log("submission", submission)
    console.log("testcases", qObj)

    const subHashKey = `${SUBMISSIONS_PREFIX}${safeMatchId}:${userId}`;
    await redis.hset(subHashKey, submissionId, JSON.stringify(submission));
    await redis.expire(subHashKey, MATCH_TTL);

    const job = await codeQueue.add("code-execution", {
      code,
      language: lang,
      testcases: qObj.questionData.testcases ?? [],
      submissionId,
      matchId: safeMatchId,
      userId,
      questionId,
    },
    {
      removeOnComplete: true,   
      removeOnFail: 10,         
    }
  );

    return res.json({ ok: true, submissionId, jobId: job.id });
  } catch (err: any) {
    console.error("submitMatch error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
};
