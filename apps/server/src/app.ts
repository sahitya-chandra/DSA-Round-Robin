import express, { Application, Request, Response } from "express";
import cors from "cors";

import friendRouter from "./routes/social.route";
import submitRouter from "./routes/submit.route";
import setQuestions from "./routes/setQuestions.route";
import matchRouter from "./routes/match.route";
import chatRouter from "./routes/chat.route";
import leaderboardRouter from "./routes/leaderboard.route";
import { CLIENT_URL } from "./config/config";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

const app: Application = express();

app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.all('/api/auth/{*any}', toNodeHandler(auth));

app.use(express.json());

app.use("/api/social", friendRouter);
app.use("/api/submit", submitRouter);
app.use("/api/setquestions", setQuestions);
app.use("/api/match", matchRouter);
app.use("/api/chat", chatRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.get("/api/me", async (req, res) => {
 	const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
	return res.json(session);
});
app.get("/api/health", (req: Request, res: Response) => {
  return res.status(200).json({ msg: "ok" })
})

export { app };
