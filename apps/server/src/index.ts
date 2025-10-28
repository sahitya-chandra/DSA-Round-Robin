import express from "express";
import http from "http";
import { initIo } from './utils/socketInstance';
import { setupSockets } from './sockets/index';
import cors from "cors";
import { PORT } from "./config/config";
import friendRouter from "./routes/social.route";
import submitRouter from "./routes/submit.route"
import setQuestions from "./routes/setQuestions.route"
import matchRouter from "./routes/createMatch.route"

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/social", friendRouter)
app.use("/api/submit", submitRouter);
app.use("/api/setquestions", setQuestions);
app.use("/api/match", matchRouter)
const server = http.createServer(app);
export const io = initIo(server);

setupSockets(io);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
