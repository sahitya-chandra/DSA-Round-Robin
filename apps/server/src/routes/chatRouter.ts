import express from "express";
import { getMessages} from "../controllers/chat.controllers";

const router : express.Router = express.Router();

router.post("/messages", getMessages);//for fetching chat history


export default router;
