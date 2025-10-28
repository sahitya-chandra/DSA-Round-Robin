import express from "express"
import { submitCode } from "../controllers/submit.controller"

const router: express.Router = express.Router()

router.post("/", submitCode)

export default router