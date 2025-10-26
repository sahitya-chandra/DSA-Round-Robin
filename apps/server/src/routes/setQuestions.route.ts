import express from "express"
import { setQuestions } from "../controllers/setQuestions.controller"

const router: express.Router = express.Router()

router.get("/setquestions", setQuestions)

export default router