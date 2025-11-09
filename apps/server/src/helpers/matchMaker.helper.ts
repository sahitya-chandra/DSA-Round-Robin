import { v4 as uuidv4 } from "uuid";
import prisma, { Question } from "@repo/db";
import { connection as redis, publisherClient } from "@repo/queue";
import {
  ACTIVE_MATCH_PREFIX,
  USER_MATCH_PREFIX,
  MATCH_DURATION_SECONDS,
  MATCH_TTL,
  WAITING_LIST,
} from "../utils/constants";

export async function createMatch(requesterId: string, opponentId: string) {
  const [rMatch, oMatch] = await Promise.all([
    redis.get(`${USER_MATCH_PREFIX}${requesterId}`),
    redis.get(`${USER_MATCH_PREFIX}${opponentId}`),
  ]);

  if (rMatch || oMatch) {
    if (!rMatch) await redis.lpush(WAITING_LIST, requesterId);
    if (!oMatch) await redis.lpush(WAITING_LIST, opponentId);
    return null;
  }

  const questions = await prisma.$queryRaw<Question[]>`
    SELECT * FROM "Question" ORDER BY RANDOM() LIMIT 5
  `;

  if (!questions || questions.length === 0) {
    await redis.lpush(WAITING_LIST, requesterId);
    await redis.lpush(WAITING_LIST, opponentId);
    console.warn("No questions available - cannot create match");
    return null;
  }

  const matchId = uuidv4();
  const mqPayload = questions.map((q, i) => ({
    questionData: q,
    order: i + 1,
  }));

  const startedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + MATCH_DURATION_SECONDS * 1000).toISOString();

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
    startedAt,
    "duration",
    `${MATCH_DURATION_SECONDS}`,
    "expiresAt",
    expiresAt
  );
  await redis.expire(`${ACTIVE_MATCH_PREFIX}${matchId}`, MATCH_TTL);

  await Promise.all([
    redis.set(`${USER_MATCH_PREFIX}${requesterId}`, matchId, "EX", MATCH_TTL),
    redis.set(`${USER_MATCH_PREFIX}${opponentId}`, matchId, "EX", MATCH_TTL),
  ]);

  const payload = {
    event: "match_started",
    data: {
      matchId,
      status: "RUNNING",
      requesterId,
      opponentId,
      questions: mqPayload,
      startedAt,
      expiresAt,
      duration: MATCH_DURATION_SECONDS,
    },
  };

  await publisherClient.publish("match_created", JSON.stringify(payload));

  console.log(`Match ${matchId} created – ${requesterId} vs ${opponentId}`);
  return { matchId, requesterId, opponentId, questions: mqPayload };
}
