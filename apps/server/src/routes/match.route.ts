import express from "express"
import { cancelMatchController, createMatch, finishMatchController, getMatch, matchController } from "../controllers/match.controller"
import { isActiveSession } from "../middleware/middleware"

const router: express.Router = express.Router()

router.get("/getmatch/:matchId",isActiveSession, getMatch);
router.get("/active", isActiveSession, getMatch);
router.post("/", isActiveSession, matchController)
router.post("/finish/:matchId", isActiveSession, finishMatchController);
router.post("/cancel", isActiveSession, cancelMatchController);
router.post("/create", createMatch);

export default router