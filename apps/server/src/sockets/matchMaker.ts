import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import prisma, { Question } from "@repo/db";
import { connection as redis, publisherClient, WAITING_LIST, USER_MATCH_PREFIX, ACTIVE_MATCH_PREFIX } from "@repo/queue";

const MATCH_TTL = 60 * 60;
const LOCK_KEY = "matchmaker_lock";
const LOCK_TTL_MS = 2000;

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

        const [rMatch, oMatch] = await Promise.all([
          redis.get(`${USER_MATCH_PREFIX}${requesterId}`),
          redis.get(`${USER_MATCH_PREFIX}${opponentId}`),
        ]);

        if (rMatch || oMatch) {
          if (!rMatch) await redis.lpush(WAITING_LIST, requesterId);
          if (!oMatch) await redis.lpush(WAITING_LIST, opponentId);
          continue;
        }

        const questions = await prisma.$queryRaw<
          Question[]
        >`SELECT * FROM "Question" ORDER BY RANDOM() LIMIT 5`;

        if (!questions || questions.length === 0) {
          await redis.lpush(WAITING_LIST, requesterId);
          await redis.lpush(WAITING_LIST, opponentId);
          console.warn("No questions available - cannot create match");
          await sleep(1000);
          continue;
        }

        const matchId = uuidv4();

        const mqPayload = questions.map((q, i) => ({
          questionData: q,
          order: i + 1,
        }));

        const startedAt = new Date().toISOString()

        await redis.hmset(
          `${ACTIVE_MATCH_PREFIX}${matchId}`,
          "status",
          "RUNNING",
          "requesterId",
          requesterId,
          "opponentId",
          opponentId,
          "questions",
          JSON.stringify(mqPayload),
          "startedAt",
          startedAt
        );
        await redis.expire(`${ACTIVE_MATCH_PREFIX}${matchId}`, MATCH_TTL);

        await redis.set(`${USER_MATCH_PREFIX}${requesterId}`, matchId, "EX", MATCH_TTL);
        await redis.set(`${USER_MATCH_PREFIX}${opponentId}`, matchId, "EX", MATCH_TTL);

        const payload = {
          event: "match_started",
          data: {
            matchId,
            status: "RUNNING",
            requesterId,
            opponentId,
            questions: mqPayload,
          },
        };
        await publisherClient.publish("match_created", JSON.stringify(payload));

        console.log(`Match ${matchId} created – ${requesterId} vs ${opponentId}`);
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
