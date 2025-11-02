import prisma from "@repo/db";
import { ACTIVE_MATCH_PREFIX, publisherClient, connection as redis, USER_MATCH_PREFIX } from "@repo/queue";

const SUBMISSIONS_PREFIX = "match_submissions:";

export async function finishMatchById(matchId: string, opts: { reason?: string, winnerId?: string } = {}) {
	const key = `${ACTIVE_MATCH_PREFIX}${matchId}`;
	const raw = await redis.hgetall(key);
	if(!raw || raw.status !== "RUNNING") return { matchId, winnerId: opts.winnerId ?? null, rScore: 0, oScore: 0 };

	await redis.hset(key, "status", "FINISHING");

	const requesterId = raw.requesterId!
	const opponentId = raw.opponentId!
	const questions = raw.questions ? JSON.parse(raw.questions) : []
	const startedAt = raw.startedAt ? new Date(raw.startedAt) : new Date()
	const endedAt = new Date()

	const rSubKey = `${SUBMISSIONS_PREFIX}${matchId}${requesterId}`
	const oSubKey = `${SUBMISSIONS_PREFIX}${matchId}${opponentId}`

	const [rList, oList] = await Promise.all([
		redis.lrange(rSubKey, 0, -1),
		redis.lrange(oSubKey, 0, -1),
	])

	const parseList = (arr: string[]) => arr.map((s) => JSON.parse(s))
	const rSubs = parseList(rList);
  const oSubs = parseList(oList);
	
	const computeScore = (subs: any[]) => {
		const solved = new Map<number, any>()
		for (const s of subs) {
			if (!s.result || s.status !== "DONE") continue
			if (!s.result.passed) continue
			const qid = s.questionId
			if (!solved.has(qid) || new Date(s.createdAt) < new Date(solved.get(qid).createdAt)) {
				solved.set(qid, s)
			}
		}

		return solved
	}

	const rSolved = computeScore(rSubs)
	const oSolved = computeScore(oSubs)

	const rScore = rSolved.size
	const oScore = oSolved.size

	let winnerId = opts.winnerId ?? null;

	if (!winnerId) {
		if (rScore > oScore) winnerId = requesterId
    else if (oScore > rScore) winnerId = opponentId;
		else {
			const rSum = Array.from(rSolved.values()).reduce((acc, s) => acc + new Date(s.createdAt).getTime, 0)
			const oSum = Array.from(oSolved.values()).reduce((acc, s) => acc + new Date(s.createdAt).getTime, 0)
			if (rSum === oSum) winnerId = null
			else winnerId = rSum < oSum ? requesterId : opponentId
		}
	}

	await prisma.$transaction(async (tx) => {
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
    for (const s of allSubs) {
      await tx.submission.create({
        data: {
          id: s.id,
          userId: s.userId || s.userId,
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
  await redis.del(`${SUBMISSIONS_PREFIX}${matchId}:${requesterId}`);
  await redis.del(`${SUBMISSIONS_PREFIX}${matchId}:${opponentId}`);

	const payload = { event: "match_finished", data: { matchId, winnerId } };
  await publisherClient.publish("match_events", JSON.stringify(payload));

	return { matchId, winnerId, rScore, oScore };
}