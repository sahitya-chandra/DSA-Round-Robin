import express, { Application, Response } from "express";
import cors from "cors";

import friendRouter from "./routes/social.route";
import submitRouter from "./routes/submit.route";
import setQuestions from "./routes/setQuestions.route";
import matchRouter from "./routes/match.route";
import chatRouter from "./routes/chat.route";
import { CLIENT_URL } from "./config/config";

const app: Application = express();

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/social", friendRouter);
app.use("/api/submit", submitRouter);
app.use("/api/setquestions", setQuestions);
app.use("/api/match", matchRouter);
app.use("/api/chat", chatRouter);
app.get("/api/health", (res: Response) => {
  return res.status(200).json({ msg: "ok"})
})

export { app };


