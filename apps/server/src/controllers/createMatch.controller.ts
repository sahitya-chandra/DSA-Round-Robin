import { Response } from "express";
import { AuthRequest } from "../types/types";
import { connection as redis, USER_MATCH_PREFIX, WAITING_LIST } from "@repo/queue";

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
