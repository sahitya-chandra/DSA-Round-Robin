import express from "express";
import { isActiveSession } from "../middleware/middleware";
import { Request, Response } from "express";
import { connection as redis, WAITING_LIST } from "@repo/queue";

const router: express.Router = express.Router();

router.post("/", isActiveSession, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "unauthenticated" });

  try {
    await redis.lrem(WAITING_LIST, 0, userId);
    return res.json({ ok: true });
  } catch (err) {
    console.error("cancelMatch error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
