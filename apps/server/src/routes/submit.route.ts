import express from "express"
import { submitMatchController } from "../controllers/submit.controller"
import { isActiveSession } from "../middleware/middleware"

const router: express.Router = express.Router()

router.post("/", isActiveSession, submitMatchController)

export default router