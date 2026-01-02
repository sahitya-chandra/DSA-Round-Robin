import { Router } from "express";
import { getLeaderboard, seedLeaderboard } from "../controllers/leaderboard.controller";

const router: Router = Router();

router.get("/", getLeaderboard);
router.post("/seed", seedLeaderboard);

export default router;
