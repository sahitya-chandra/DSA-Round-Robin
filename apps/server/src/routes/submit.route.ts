import express from "express"
import { submitMatchController } from "../controllers/submit.controller"
import { submitPracticeController } from "../controllers/matchPractice.controller"
import { isActiveSession } from "../middleware/middleware"

const router: express.Router = express.Router()

router.post("/", isActiveSession, submitMatchController)
router.post("/solo" , isActiveSession, submitPracticeController);

export default router