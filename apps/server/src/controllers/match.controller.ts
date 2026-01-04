import { Request, Response } from "express";
import { AuthRequest } from "../types/types";
import {
  cancelQueuedMatch,
  createManualMatch,
  finishMatchForUser,
  getMatchForUser,
  getActiveMatchForUser,
  queueUserForMatch,
} from "../services/match.service";

export const matchController = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user?.id) return res.status(401).json({ error: "unauthenticated" });

  const userId = user.id;

  try {
    const result = await queueUserForMatch(userId);
    return res.status(200).json(result);
  } catch (err) {
    console.error("matchController error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
};

export const cancelMatchController = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "unauthenticated" });

  try {
    await cancelQueuedMatch(userId);
    return res.json({ ok: true });
  } catch (err) {
    console.error("cancelMatch error:", err);
    res.status(500).json({ error: "internal_error" });
  }
};

export const finishMatchController = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { matchId } = req.params;

  if (!userId || !matchId)
    return res.status(400).json({ error: "bad request" });

  try {
    await finishMatchForUser(matchId, userId);
    return res.json({ ok: true });
  } catch (err: any) {
    if (err.code === "FORBIDDEN") {
      return res.status(403).json({ error: "not a participant" });
    }
    console.error("finishMatch error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
};

export const getMatch = async (req: AuthRequest, res: Response) => {
  let { matchId } = req.params;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ error: "unauthenticated" });

  try {
    if (!matchId) {
      const match = await getActiveMatchForUser(userId);
      return res.json(match);
    }

    const match = await getMatchForUser(matchId, userId);
    return res.json(match);
  } catch (err: any) {
    if (err.code === "NOT_FOUND") {
      return res.status(404).json({ error: "Match not found or expired" });
    }
    if (err.code === "NOT_RUNNING") {
      return res.status(400).json({ error: "Match has already ended" });
    }
    if (err.code === "FORBIDDEN") {
      return res.status(403).json({ error: "forbidden" });
    }
    return res.status(500).json({ error: err.message ?? "internal_error" });
  }
};

export const createMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { requesterId, opponentId } = req.body;

    if (!requesterId || !opponentId) {
      return res.status(400).json({ error: "Missing user IDs" });
    }

    console.log("Manual match creation requested:", {
      requesterId,
      opponentId,
    });

    const match = await createManualMatch(requesterId, opponentId);

    return res.json({ ok: true, matchId: match.matchId });
  } catch (err) {
    console.error("createMatch error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
};

