import { Server } from "socket.io";
import { connection as redis } from "@repo/queue";
import { LOCK_KEY, WAITING_LIST } from "../utils/constants";
import { createMatch } from "../helpers/matchMaker.helper";

const LOCK_TTL_MS = 8000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function startMatchMaker(io: Server) {
  (async function loop() {
    while (true) {
      try {
        const lock = await redis.set(LOCK_KEY, "1", "PX", LOCK_TTL_MS, "NX");
        if (!lock) {
          await sleep(200);
          continue;
        }

        const requesterId = await redis.rpop(WAITING_LIST);
        if (!requesterId) {
          await sleep(300);
          continue;
        }

        const opponentId = await redis.rpop(WAITING_LIST);
        if (!opponentId) {
          const pos = await redis.lpos(WAITING_LIST, requesterId);
          if (pos === null) {
            await redis.lpush(WAITING_LIST, requesterId);
          }

          await sleep(100);
          continue;
        }

        await createMatch(requesterId, opponentId);
      } catch (err) {
        console.error("Match-maker error:", err);
        await sleep(500);
      }
    }
  })();

  process.on("SIGTERM", () => {
    console.log("Matchmaker shutting down");
  });
}
