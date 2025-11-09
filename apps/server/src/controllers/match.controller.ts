import { Request, Response } from "express";
import { AuthRequest } from "../types/types";
import { connection as redis } from "@repo/queue";
import { finishMatchById } from "../helpers/finishMatch.helper";
import { ACTIVE_MATCH_PREFIX, USER_MATCH_PREFIX, WAITING_LIST } from "../utils/constants";
import { createMatch as createMatchHelper } from "../helpers/matchMaker.helper";

export const matchController = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user?.id) return res.status(401).json({ error: "unauthenticated" });

  const userId = user.id;

  try {
    const activeMatch = await redis.get(`${USER_MATCH_PREFIX}${userId}`);
    if (activeMatch) {
      return res.status(200).json({ status: "already_in_match", matchId: activeMatch });
    }

    const LUA_ADD_IF_NOT_EXISTS = `
      if redis.call('lpos', KEYS[1], ARGV[1]) == false then
        redis.call('lpush', KEYS[1], ARGV[1])
        return 1
      end
      return 0
    `;
    const added = await redis.eval(
      LUA_ADD_IF_NOT_EXISTS,
      1,                 
      WAITING_LIST,      
      userId            
    );
    if (added === 0) {
      return res.status(200).json({ status: "already_queued" });
    }

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

  if (!userId || !matchId) return res.status(400).json({ error: "bad request" });

  try {
    const raw = await redis.hgetall(`${ACTIVE_MATCH_PREFIX}${matchId}`);
    if (!raw || (raw.requesterId !== userId && raw.opponentId !== userId)) {
      return res.status(403).json({ error: "not a participant" });
    }
    await finishMatchById(matchId, { winnerId: raw.opponentId === userId ? raw.requesterId : raw.opponentId });
    return res.json({ ok: true });
  } catch (err) {
    console.error("finishMatch error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
};

export const getMatch = async (req: AuthRequest, res: Response) => {
  const { matchId } = req.params;
  const userId = req.user?.id

  try {
    const matchKey = `${ACTIVE_MATCH_PREFIX}${matchId}`;
    const data = await redis.hgetall(matchKey);

     if (!data || !data.status) {
      return res.status(404).json({ error: "Match not found or expired" });
    }

    if (data.status !== "RUNNING") {
      return res.status(400).json({ error: "Match has already ended" });
    }

    if (data.requesterId !== userId && data.opponentId !== userId) {
      return res.status(403).json({ error: "forbidden" });
    }

    if (!data || Object.keys(data).length === 0)
      return res.status(404).json({ error: "Match not found" });

    const questions = data.questions ? JSON.parse(data.questions) : [];

    return res.json({
      matchId,
      requesterId: data.requesterId,
      opponentId: data.opponentId,
      status: data.status,
      startedAt: data.startedAt,
      duration: data.duration,
      questions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { requesterId, opponentId } = req.body;

    if (!requesterId || !opponentId) {
      return res.status(400).json({ error: "Missing user IDs" });
    }

    console.log("🔹 Manual match creation requested:", { requesterId, opponentId });

    // Use the same logic your matchMaker.helper uses internally
    const match = await createMatchHelper(requesterId, opponentId);

    // `createMatchHelper` should already create redis entries
    // but if not, ensure this data is consistent
    if (!match?.matchId) {
      const matchId = `${Date.now()}:${requesterId}:${opponentId}`;
      const matchKey = `${ACTIVE_MATCH_PREFIX}${matchId}`;
      const matchData = {
        requesterId,
        opponentId,
        status: "RUNNING",
        startedAt: Date.now().toString(),
        duration: "600000",
      };
      await redis.hmset(matchKey, matchData);
      await redis.set(`${USER_MATCH_PREFIX}${requesterId}`, matchId);
      await redis.set(`${USER_MATCH_PREFIX}${opponentId}`, matchId);

      return res.json({ ok: true, matchId });
    }

    return res.json({ ok: true, matchId: match.matchId });
  } catch (err) {
    console.error("createMatch error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
};
