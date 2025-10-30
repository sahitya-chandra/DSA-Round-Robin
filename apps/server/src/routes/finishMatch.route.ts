import express from "express";
import { isActiveSession } from "../middleware/middleware";
import { finishMatchController } from "../controllers/finishMatch.controller";

const router: express.Router = express.Router();
router.post("/:matchId", isActiveSession, finishMatchController);
export default router;