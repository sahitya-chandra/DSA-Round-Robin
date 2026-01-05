import { Response } from "express";
import { v4 as uuidv4 } from "uuid";

import prisma from "@repo/db";
import { connection as redis, codeQueue } from "@repo/queue";
import { AuthRequest } from "../types/types";
import { workerManager } from "../utils/WorkerManager";

export const submitPracticeController = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { questionId, code, language } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "unauthenticated" });
  }
  if (!questionId || !code) {
    return res.status(400).json({ error: "bad_request" });
  }

  const ALLOWED_LANGS = ["cpp", "python", "javascript"] as const;
  const lang = ALLOWED_LANGS.includes(language as any) ? language : "cpp";

  try {
    const question = await prisma.question.findUnique({
      where: { id: Number(questionId) },
    });

    if (!question) {
      return res.status(400).json({ error: "question_not_found" });
    }

    const submissionId = uuidv4();
    const createdAt = new Date().toISOString();

    const submission = {
      id: submissionId,
      userId,
      questionId: Number(questionId),
      code,
      language: lang,
      createdAt,
      status: "PENDING",
      result: null,
    };

    // const subHashKey = `${SUBMISSIONS_PREFIX}practice:${userId}`;
    // await redis.hset(subHashKey, submissionId, JSON.stringify(submission));
    // await redis.expire(subHashKey, MATCH_TTL);

    await workerManager.incrementBusy();

    const job = await codeQueue.add(
      "code-execution",
      {
        code,
        language: lang,
        testcases: (question as any).testcases ?? [],
        submissionId,
        matchId: "practice",             
        userId,
        questionId: Number(questionId),
      },
      {
        removeOnComplete: true,
        removeOnFail: 10,
      }
    );

    return res.json({
      ok: true,
      mode: "practice",
      submissionId,
      jobId: job.id,
    });
  } catch (err: any) {
    console.error("submitPractice error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
};
