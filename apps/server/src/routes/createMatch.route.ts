import express from "express"
import { matchController } from "../controllers/createMatch.controller"
import { isActiveSession } from "../middleware/middleware"

const router: express.Router = express.Router()

router.post("/match", isActiveSession, matchController)

export default router