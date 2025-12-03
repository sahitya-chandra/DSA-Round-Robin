import { Response } from "express";
import { v4 as uuidv4 } from "uuid";

import prisma from "@repo/db";
import { connection as redis, codeQueue } from "@repo/queue";
import { AuthRequest } from "../types/types";
import { MATCH_TTL, SUBMISSIONS_PREFIX } from "../utils/constants";

export const submitPracticeController = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { questionId, code, language } = req.body;

  // // 1. Enforce auth + input validation (same standard as 1v1)
  // if (!userId) {
  //   return res.status(401).json({ error: "unauthenticated" });
  // }
  // if (!questionId || !code) {
  //   return res.status(400).json({ error: "bad_request" });
  // }

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

    // 2. Use a predictable key per user for practice submissions
    const subHashKey = `${SUBMISSIONS_PREFIX}practice:${userId}`;
    await redis.hset(subHashKey, submissionId, JSON.stringify(submission));
    await redis.expire(subHashKey, MATCH_TTL);

    // 3. Enqueue job with enough info for worker to:
    //    - know it's practice mode
    //    - know which user/room to emit to
    const job = await codeQueue.add(
      "code-execution",
      {
        code,
        language: lang,
        testcases: (question as any).testcases ?? [],
        submissionId,
        matchId: null,              // distinguish from 1v1
        userId,
        questionId: Number(questionId),
        mode: "practice",           // <--- tell worker this is practice
        practiceRoomId: `practice:${userId}`, // <--- socket room
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
