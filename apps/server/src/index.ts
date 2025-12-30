import http from "http";
import { initIo } from './utils/socketInstance';
import { setupSockets } from './sockets/index';
import { PORT } from "./config/config";
import { matchSweeper } from "./sockets/matchSweeper";
import { setupChatSocket } from "./sockets/chatsocket";
import { app } from "./app";
import { initJudge0Worker } from "./workers/judge0Worker";

const server = http.createServer(app);
export const io = initIo(server);

setupSockets(io);
setupChatSocket(io);
initJudge0Worker();

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  matchSweeper()
});
