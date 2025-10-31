import { Request, Response } from "express";
import { AuthRequest } from "../types/types";
import prisma from "@repo/db";
import { ACTIVE_MATCH_PREFIX, connection as redis, USER_MATCH_PREFIX } from "@repo/queue";

export const finishMatchController = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { matchId } = req.params;
  const { winnerId } = req.body;

  if (!userId || !matchId) return res.status(400).json({ error: "bad request" });

  try {
    const raw = await redis.hgetall(`${ACTIVE_MATCH_PREFIX}${matchId}`);
    if (!raw || !raw.status) return res.status(404).json({ error: "match not found" });

    const requesterId = raw.requesterId;
    const opponentId = raw.opponentId;
    const questions = raw.questions ? JSON.parse(raw.questions as string) : [];
    const startedAt = raw.startedAt

    await prisma.$transaction(async (tx) => {
      await tx.match.create({
        data: {
          id: matchId,
          status: "FINISHED",
          winnerId: winnerId ?? null,
          startedAt,
          endedAt: new Date(),
          participants: {
            create: [
              { userId: requesterId! },
              { userId: opponentId! },
            ],
          },
          questions: {
            createMany: {
              data: questions.map((q: any) => ({
                questionId: q.questionId,
                order: q.order,
              })),
            },
          },
        },
      });

      // persist submissions from Redis here (omitted) optional
    });

    await redis.del(`${ACTIVE_MATCH_PREFIX}${matchId}`);
    if (requesterId) await redis.del(`${USER_MATCH_PREFIX}${requesterId}`);
    if (opponentId) await redis.del(`${USER_MATCH_PREFIX}${opponentId}`);

    return res.json({ ok: true });
  } catch (err) {
    console.error("finishMatch error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
};
