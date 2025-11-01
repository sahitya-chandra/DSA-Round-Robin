import { Request, Response } from "express";
import { AuthRequest } from "../types/types";
import { ACTIVE_MATCH_PREFIX, connection as redis, USER_MATCH_PREFIX, WAITING_LIST } from "@repo/queue";
import prisma from "@repo/db";

export const matchController = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user?.id) return res.status(401).json({ error: "unauthenticated" });

  const userId = user.id;

  try {
    const activeMatch = await redis.get(`${USER_MATCH_PREFIX}${userId}`);
    if (activeMatch) {
      return res.status(200).json({ status: "already_in_match", matchId: activeMatch });
    }

    const pos = await redis.lpos(WAITING_LIST, userId);
    if (pos !== null) {
      return res.status(200).json({ status: "already_queued" });
    }

    await redis.lpush(WAITING_LIST, userId);

    return res.json({ status: "queued" });
  } catch (err) {
    console.error("matchController error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
};

export const cancelMatchController = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "unauthenticated" });

  try {
    await redis.lrem(WAITING_LIST, 0, userId);
    return res.json({ ok: true });
  } catch (err) {
    console.error("cancelMatch error:", err);
    res.status(500).json({ error: "internal_error" });
  }
}

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
    const startedAt = new Date(String(raw.startedAt))

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
                questionId: q.questionData.id,
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

export const getMatch = async (req: Request, res: Response) => {
  const { matchId } = req.params;
  try {
    const matchKey = `${ACTIVE_MATCH_PREFIX}${matchId}`;
    const data = await redis.hgetall(matchKey);

    if (!data || Object.keys(data).length === 0)
      return res.status(404).json({ error: "Match not found" });

    const questions = data.questions ? JSON.parse(data.questions) : [];

    return res.json({
      matchId,
      requesterId: data.requesterId,
      opponentId: data.opponentId,
      status: data.status,
      startedAt: data.startedAt,
      questions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
