import { Server } from "socket.io";
import { connection as redis } from "@repo/queue";
import { WAITING_LIST } from "../utils/constants";
import { createMatch } from "../helpers/matchMaker.helper";
import { userSockets } from "../utils/utils";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function startMatchMaker(io: Server) {
  const blockingRedis = redis.duplicate();

  (async function loop() {
    console.log("Matchmaker started (atomic Redis + sockets)");

    while (true) {
      try {
        const result = await blockingRedis.brpop(WAITING_LIST, 0);
        if (!result) continue;

        const requesterId = result[1];
        
        const opponentId = await redis.rpop(WAITING_LIST);

        if (!opponentId) {
          await redis.rpush(WAITING_LIST, requesterId);
          await sleep(5000); 
          continue;
        }

        console.log(`Matchmaker: ${requesterId} vs ${opponentId}`);

        let match;
        try {
          match = await createMatch(requesterId, opponentId);
        } catch (err) {
          console.error("createMatch failed, requeueing users", err);

          await redis.rpush(WAITING_LIST, requesterId);
          await redis.rpush(WAITING_LIST, opponentId);

          continue;
        }

        if (!match) {
          console.warn("createMatch returned null");
          continue;
        }

        const { matchId, questions, startedAt, duration } = match;

        const reqSocketId = userSockets.get(requesterId);
        const oppSocketId = userSockets.get(opponentId);

        const reqSocket = reqSocketId
          ? io.sockets.sockets.get(reqSocketId)
          : null;

        const oppSocket = oppSocketId
          ? io.sockets.sockets.get(oppSocketId)
          : null;

        if (reqSocket) reqSocket.join(matchId);
        if (oppSocket) oppSocket.join(matchId);

        io.to(matchId).emit("match:ready", {
          matchId,
          startedAt,
        });

        if (reqSocket) {
          reqSocket.emit("match_started", {
            matchId,
            opponentId,
            questions,
            startedAt,
            duration,
          });
        }

        if (oppSocket) {
          oppSocket.emit("match_started", {
            matchId,
            opponentId: requesterId,
            questions,
            startedAt,
            duration,
          });
        }

        console.log(
          `Emitted match_started and match:ready for ${matchId} (requester: ${requesterId}, opponent: ${opponentId})`
        );
      } catch (err) {
        console.error("Matchmaker loop error:", err);
        await sleep(1000);
      }
    }
  })();

  process.on("SIGTERM", () => {
    console.log("Matchmaker shutting down");
  });
}