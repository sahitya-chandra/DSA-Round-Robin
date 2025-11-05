import express from "express";
import { getMessages} from "../controllers/chat.controller";

const router : express.Router = express.Router();

router.post("/messages", getMessages);//for fetching chat history


export default router;
