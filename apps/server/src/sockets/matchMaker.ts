import { Server } from "socket.io";
import { connection as redis } from "@repo/queue";
import { WAITING_LIST } from "../utils/constants";
import { createMatch } from "../helpers/matchMaker.helper";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function startMatchMaker(io: Server) {
  const blockingRedis = redis.duplicate();

  (async function loop() {
    console.log("Matchmaker started with BLPOP");
    while (true) {
      try {
        const result = await blockingRedis.brpop(WAITING_LIST, 0); 
        if (!result) continue; 

        const requesterId = result[1];
        
        const opponentId = await redis.rpop(WAITING_LIST);

        if (!opponentId) {
          await redis.rpush(WAITING_LIST, requesterId);
          await sleep(500); 
          continue;
        }

        console.log(`Matchmaker: Pairing ${requesterId} vs ${opponentId}`);
        await createMatch(requesterId, opponentId);

      } catch (err) {
        console.error("Match-maker error:", err);
        await sleep(1000);
      }
    }
  })();

  process.on("SIGTERM", () => {
    console.log("Matchmaker shutting down");
  });
}
