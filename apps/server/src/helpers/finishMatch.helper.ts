import prisma from "@repo/db";
import { publisherClient, connection as redis } from "@repo/queue";
import { ACTIVE_MATCH_PREFIX, SUBMISSIONS_PREFIX, USER_MATCH_PREFIX } from "../utils/constants";

export async function finishMatchById(matchId: string, opts: { reason?: string, winnerId?: string } = {}) {
  const key = `${ACTIVE_MATCH_PREFIX}${matchId}`;
  const raw = await redis.hgetall(key);
  if (!raw || raw.status !== "RUNNING") return { matchId, winnerId: opts.winnerId ?? null, rScore: 0, oScore: 0 };

  await redis.hset(key, "status", "FINISHING");

  const requesterId = raw.requesterId!;
  const opponentId = raw.opponentId!;
  const questions = raw.questions ? JSON.parse(raw.questions) : [];
  const startedAt = raw.startedAt ? new Date(raw.startedAt) : new Date();
  const endedAt = new Date();

  const rSubKey = `${SUBMISSIONS_PREFIX}${matchId}:${requesterId}`;
  const oSubKey = `${SUBMISSIONS_PREFIX}${matchId}:${opponentId}`;

  const [rHash, oHash] = await Promise.all([
    redis.hgetall(rSubKey),
    redis.hgetall(oSubKey),
  ]);

  // console.log("rHash keys:", Object.keys(rHash));
  // console.log("oHash keys:", Object.keys(oHash));

  const parseHash = (hash: Record<string, string>) => 
    Object.values(hash).map((s) => JSON.parse(s));

  const rSubs = parseHash(rHash);
  const oSubs = parseHash(oHash);

  // console.log("rSubs parsed:", rSubs);
  // console.log("oSubs parsed:", oSubs);

  const computeScore = (subs: any[]) => {
    const solved = new Map<number, any>();
    for (const s of subs) {
      if (!s.result || s.status !== "DONE") continue;
      if (!s.result.passed) continue;
      const qid = s.questionId;
      if (!solved.has(qid) || new Date(s.createdAt) < new Date(solved.get(qid).createdAt)) {
        solved.set(qid, s);
      }
    }
    return solved;
  };

  const rSolved = computeScore(rSubs);
  const oSolved = computeScore(oSubs);

  const rScore = rSolved.size;
  const oScore = oSolved.size;

  let winnerId = opts.winnerId ?? null;

  if (!winnerId) {
    if (rScore > oScore) winnerId = requesterId;
    else if (oScore > rScore) winnerId = opponentId;
    else {
      const rSum = Array.from(rSolved.values()).reduce((acc, s) => acc + new Date(s.createdAt).getTime(), 0);
      const oSum = Array.from(oSolved.values()).reduce((acc, s) => acc + new Date(s.createdAt).getTime(), 0);
      winnerId = rSum === oSum ? null : (rSum < oSum ? requesterId : opponentId);
    }
  }

  await prisma.$transaction(async (tx) => {
    const requester = await tx.user.findUnique({ where: { id: requesterId }, select: { rating: true } });
    const opponent = await tx.user.findUnique({ where: { id: opponentId }, select: { rating: true } });

    const rRating = requester?.rating || 1200;
    const oRating = opponent?.rating || 1200;

    const K = 32;
    const expectedScoreR = 1 / (1 + Math.pow(10, (oRating - rRating) / 400));
    const expectedScoreO = 1 / (1 + Math.pow(10, (rRating - oRating) / 400));

    let actualScoreR = 0.5; // Draw
    if (winnerId === requesterId) actualScoreR = 1;
    else if (winnerId === opponentId) actualScoreR = 0;

    const newRatingR = Math.round(rRating + K * (actualScoreR - expectedScoreR));
    const newRatingO = Math.round(oRating + K * ((1 - actualScoreR) - expectedScoreO));

    await tx.user.update({ where: { id: requesterId }, data: { rating: newRatingR } });
    await tx.user.update({ where: { id: opponentId }, data: { rating: newRatingO } });

    await tx.match.create({
      data: {
        id: matchId,
        status: "FINISHED",
        winnerId,
        startedAt,
        endedAt,
        participants: {
          create: [
            { userId: requesterId },
            { userId: opponentId },
          ],
        },
        questions: {
          createMany: {
            data: questions.map((q: any) => ({
              questionId: q.questionData.id,
              order: q.order,
            })),
          },
        },
      },
    });

    const allSubs = [...rSubs, ...oSubs];
    // console.log("Saving submissions:", allSubs.length);

    for (const s of allSubs) {
      await tx.submission.create({
        data: {
          id: s.id,
          userId: s.userId,
          questionId: s.questionId,
          matchId,
          code: s.code,
          status: s.status === "DONE" && s.result?.passed ? "ACCEPTED" : "REJECTED",
          createdAt: new Date(s.createdAt),
        },
      });
    }
  });

  await redis.del(`${ACTIVE_MATCH_PREFIX}${matchId}`);
  await redis.del(`${USER_MATCH_PREFIX}${requesterId}`);
  await redis.del(`${USER_MATCH_PREFIX}${opponentId}`);
  await redis.del(rSubKey);
  await redis.del(oSubKey);

  const payload = { event: "match_finished", data: { matchId, winnerId } };
  await publisherClient.publish("match_events", JSON.stringify(payload));

  return { matchId, winnerId, rScore, oScore };
}