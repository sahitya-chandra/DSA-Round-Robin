import express from "express"
import { cancelMatchController, finishMatchController, getMatch, matchController } from "../controllers/match.controller"
import { isActiveSession } from "../middleware/middleware"

const router: express.Router = express.Router()

router.post("/", isActiveSession, matchController)
router.get("/getmatch/:matchId", getMatch);
router.post("/finish/:matchId", isActiveSession, finishMatchController);
router.post("/cancel", isActiveSession, cancelMatchController);

export default router