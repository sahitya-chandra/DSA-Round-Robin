import express from "express"
import { setQuestions } from "../controllers/setQuestions.controller"

const router: express.Router = express.Router()

router.post("/", setQuestions)

export default router