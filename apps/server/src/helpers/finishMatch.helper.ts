import prisma from "@repo/db";
import { publisherClient, connection as redis } from "@repo/queue";
import { expirationManager } from "../utils/ExpirationManager";
import { workerManager } from "../utils/WorkerManager";
import { ACTIVE_MATCH_PREFIX, SUBMISSIONS_PREFIX, USER_MATCH_PREFIX, MATCH_EXPIRATIONS_KEY } from "../utils/constants";
import { getIo } from "../utils/socketInstance";
import { getCustomParticipants } from "./participants.helper";

export async function finishMatchById(matchId: string, opts: { reason?: string, winnerId?: string } = {}) {
  const key = `${ACTIVE_MATCH_PREFIX}${matchId}`;
  const raw = await redis.hgetall(key);
  if (!raw || raw.status !== "RUNNING") return { matchId, winnerId: opts.winnerId ?? null, rScore: 0, oScore: 0 };

  // Custom N-player lobby matches use a separate, casual (no-Elo) finish path.
  if (raw.mode === "custom") {
    return finishCustomMatchById(matchId, raw, opts);
  }

  await redis.hset(key, "status", "FINISHING");

  const requesterId = raw.requesterId!;
  const opponentId = raw.opponentId!;

  try {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 1000;

    let lastError: any;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const questions: Array<{ questionData: { id: string }, order: number }> = raw.questions ? JSON.parse(raw.questions) : [];
        const startedAt = raw.startedAt ? new Date(raw.startedAt) : new Date();
        const endedAt = new Date();

        const rSubKey = `${SUBMISSIONS_PREFIX}${matchId}:${requesterId}`;
        const oSubKey = `${SUBMISSIONS_PREFIX}${matchId}:${opponentId}`;

        const [rHash, oHash] = await Promise.all([
          redis.hgetall(rSubKey),
          redis.hgetall(oSubKey),
        ]);

        const parseHash = (hash: Record<string, string>) => 
          Object.values(hash || {}).map((s) => JSON.parse(s));

        const rSubs = parseHash(rHash || {});
        const oSubs = parseHash(oHash || {});

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
            const rSum = Array.from(rSolved.values()).reduce((acc: number, s: any) => acc + new Date(s.createdAt).getTime(), 0);
            const oSum = Array.from(oSolved.values()).reduce((acc: number, s: any) => acc + new Date(s.createdAt).getTime(), 0);
            winnerId = rSum === oSum ? null : (rSum < oSum ? requesterId : opponentId);
          }
        }

        await prisma.$transaction(async (tx: any) => {
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
          const ratingChangeR = newRatingR - rRating;
          const ratingChangeO = newRatingO - oRating;

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
                  { userId: requesterId, ratingChange: ratingChangeR },
                  { userId: opponentId, ratingChange: ratingChangeO },
                ],
              },
              questions: {
                createMany: {
                  data: questions.map((q) => ({
                    questionId: q.questionData.id,
                    order: q.order,
                  })),
                },
              },
            },
          });

          const allSubs = [...rSubs, ...oSubs];

          await tx.submission.createMany({
            data: allSubs.map((s) => ({
              id: s.id,
              userId: s.userId,
              questionId: s.questionId,
              matchId,
              code: s.code,
              status: s.status === "DONE" && s.result?.passed ? "ACCEPTED" : "REJECTED",
              createdAt: new Date(s.createdAt),
            })),
          });
          // --- START LEADERBOARD UPDATES ---

          const updateLeaderboard = async (userId: string, isWinner: boolean, newRating: number) => {
            const entry = await tx.leaderboardEntry.findUnique({ where: { userId } });
            
            let winStreak = entry?.winStreak || 0;
            if (isWinner) {
              winStreak += 1;
            } else {
              winStreak = 0;
            }

            const bestWinStreak = Math.max(entry?.bestWinStreak || 0, winStreak);

            await tx.leaderboardEntry.upsert({
              where: { userId },
              create: {
                userId,
                rating: newRating,
                wins: isWinner ? 1 : 0,
                losses: isWinner ? 0 : 1,
                totalMatches: 1,
                winStreak,
                bestWinStreak,
                lastMatchAt: endedAt,
              },
              update: {
                rating: newRating,
                wins: { increment: isWinner ? 1 : 0 },
                losses: { increment: isWinner ? 0 : 1 },
                totalMatches: { increment: 1 },
                winStreak,
                bestWinStreak,
                lastMatchAt: endedAt,
              },
            });
          };

          // Update requester
          await updateLeaderboard(requesterId, winnerId === requesterId, newRatingR);

          // Update opponent
          await updateLeaderboard(opponentId, winnerId === opponentId, newRatingO);

          // --- END LEADERBOARD UPDATES ---

        }, {
          timeout: 20000,
        });

        await redis.del(`${ACTIVE_MATCH_PREFIX}${matchId}`);
        await redis.del(`${USER_MATCH_PREFIX}${requesterId}`);
        await redis.del(`${USER_MATCH_PREFIX}${opponentId}`);
        await redis.del(rSubKey);
        await redis.del(oSubKey);
        
        expirationManager.cancel(matchId);
        await redis.zrem(MATCH_EXPIRATIONS_KEY, matchId);
        await workerManager.decrementBusy();

        const payload = { event: "match_finished", data: { matchId, winnerId } };
        await publisherClient.publish("match_events", JSON.stringify(payload));

        // Emit real-time leaderboard update
        try {
            getIo().emit("leaderboard_update");
        } catch (e) {
            console.error("Failed to emit leaderboard_update:", e);
        }

        return { matchId, winnerId, rScore, oScore };
      } catch (err) {
        lastError = err;
        if (attempt < MAX_RETRIES) {
          console.warn(`finishMatchById attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS}ms...`, err);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        } else {
          throw err;
        }
      }
    }
    
    throw lastError;
  } catch (err) {
    console.error("finishMatchById error, reverting status to RUNNING:", err);
    await redis.hset(key, "status", "RUNNING");
    throw err;
  }
}

export interface CustomMatchResult {
  userId: string;
  name: string;
  score: number;
  rank: number;
}

/**
 * Finishes an N-player custom (lobby) match. Casual mode: ranks players by
 * number of questions solved (ties broken by earliest cumulative solve time),
 * persists the match + submissions, but does NOT touch Elo ratings or the
 * global leaderboard.
 */
export async function finishCustomMatchById(
  matchId: string,
  raw: Record<string, string>,
  opts: { reason?: string; winnerId?: string } = {}
) {
  const key = `${ACTIVE_MATCH_PREFIX}${matchId}`;
  await redis.hset(key, "status", "FINISHING");

  const participants = getCustomParticipants(raw);

  try {
    const questions: Array<{ questionData: { id: number }; order: number }> =
      raw.questions ? JSON.parse(raw.questions) : [];
    const startedAt = raw.startedAt ? new Date(raw.startedAt) : new Date();
    const endedAt = new Date();

    // Gather each participant's submissions and compute their solved set.
    const perPlayer = await Promise.all(
      participants.map(async (p) => {
        const subKey = `${SUBMISSIONS_PREFIX}${matchId}:${p.id}`;
        const hash = await redis.hgetall(subKey);
        const subs = Object.values(hash || {}).map((s) => JSON.parse(s));

        const solved = new Map<number, any>();
        for (const s of subs) {
          if (!s.result || s.status !== "DONE" || !s.result.passed) continue;
          const qid = s.questionId;
          if (
            !solved.has(qid) ||
            new Date(s.createdAt) < new Date(solved.get(qid).createdAt)
          ) {
            solved.set(qid, s);
          }
        }

        const sumTime = Array.from(solved.values()).reduce(
          (acc: number, s: any) => acc + new Date(s.createdAt).getTime(),
          0
        );

        return { player: p, subs, score: solved.size, sumTime, subKey };
      })
    );

    // Rank: most solved first, then earliest cumulative solve time.
    const ranked = [...perPlayer].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.sumTime - b.sumTime;
    });

    const results: CustomMatchResult[] = ranked.map((r, i) => ({
      userId: r.player.id,
      name: r.player.name,
      score: r.score,
      rank: i + 1,
    }));

    let winnerId = opts.winnerId ?? null;
    if (!winnerId) {
      const top = ranked[0];
      winnerId = top && top.score > 0 ? top.player.id : null;
    }

    const allSubs = perPlayer.flatMap((p) => p.subs);

    // Lobbies let anyone join, so a participant's account may no longer exist
    // (deleted user, stale session). Persist only valid users to avoid a
    // foreign-key violation that would otherwise fail the whole finish.
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: participants.map((p) => p.id) } },
      select: { id: true },
    });
    const validIds = new Set(existingUsers.map((u) => u.id));
    const validParticipants = participants.filter((p) => validIds.has(p.id));
    const validSubs = allSubs.filter((s) => validIds.has(s.userId));

    await prisma.$transaction(
      async (tx: any) => {
        await tx.match.create({
          data: {
            id: matchId,
            status: "FINISHED",
            winnerId,
            startedAt,
            endedAt,
            participants: {
              create: validParticipants.map((p) => ({
                userId: p.id,
                ratingChange: null, // casual: no rating impact
              })),
            },
            questions: {
              createMany: {
                data: questions.map((q) => ({
                  questionId: q.questionData.id,
                  order: q.order,
                })),
              },
            },
          },
        });

        if (validSubs.length > 0) {
          await tx.submission.createMany({
            data: validSubs.map((s) => ({
              id: s.id,
              userId: s.userId,
              questionId: s.questionId,
              matchId,
              code: s.code,
              status:
                s.status === "DONE" && s.result?.passed ? "ACCEPTED" : "REJECTED",
              createdAt: new Date(s.createdAt),
            })),
          });
        }
      },
      { timeout: 20000 }
    );

    // Cleanup Redis state.
    await redis.del(key);
    for (const p of perPlayer) {
      await redis.del(`${USER_MATCH_PREFIX}${p.player.id}`);
      await redis.del(p.subKey);
    }
    expirationManager.cancel(matchId);
    await redis.zrem(MATCH_EXPIRATIONS_KEY, matchId);
    await workerManager.decrementBusy();

    const payload = {
      event: "match_finished",
      data: { matchId, winnerId, mode: "custom", results, reason: opts.reason },
    };
    await publisherClient.publish("match_events", JSON.stringify(payload));

    console.log(`Custom match finished: ${matchId}, winner: ${winnerId}`);
    return { matchId, winnerId, results };
  } catch (err) {
    console.error("finishCustomMatchById error, reverting status to RUNNING:", err);
    await redis.hset(key, "status", "RUNNING");
    throw err;
  }
}