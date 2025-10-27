import prisma, { MatchStatus, Question } from "@repo/db";
import { connection as redis, createMatchWorker } from "@repo/queue";

createMatchWorker(async (job) => {
	const { id: requesterId } = job.data

	const pendingMatch = await prisma.match.findFirst({
		where: {
			status: MatchStatus.WAITING
		},
		include: {
			participants: {
				select: {userId: true}
			}
		}
	})

	let matchId: string
	let opponentId: string | null = null;

	if (pendingMatch && pendingMatch.participants.length === 1) {
		const [ waiting ] = pendingMatch.participants

		if (!waiting) return null

		opponentId = waiting.userId
		matchId = pendingMatch.id

		await prisma.matchParticipant.create({
			data: {
				matchId,
				userId: opponentId
			}
		})

		await prisma.match.update({
			where: {
				id: matchId
			},
			data: {
				status: MatchStatus.RUNNING,
				startedAt: new Date()
			}
		})
	} else {
		const newMatch = await prisma.match.create({
			data: {
				status: MatchStatus.WAITING
			}
		})
	
		matchId = newMatch.id
	
		await prisma.matchParticipant.create({
			data: {
				matchId,
				userId: requesterId
			}
		})
	}

	const match = await prisma.match.findUnique({
		where: {
			id: matchId
		},
		select: {
			status: true
		}
	})

	const questions = await prisma.$queryRaw`
		SELECT *
		FROM "Question"
		ORDER BY RANDOM()
		LIMIT 5;
	` as Question[];

	let questionsPayload: Array<{ questionId: number; order: number }> = [];
	
	if(match?.status === MatchStatus.RUNNING) {
		const mqData: Array<{ matchId: string; questionId: number; order: number }> = questions.map((q, idx) => {
			return {
				matchId, 
				questionId: q.id,
				order: idx + 1
			}
		})

		await prisma.matchQuestion.createMany({ data: mqData })

		questionsPayload = mqData
	}

	// still not sure to directly return
	// also improve error handeling
	const payload = {
		event: "match_started",
		data: {
			matchId, 
			status: match?.status ?? MatchStatus.WAITING,
			requesterId,
			opponentId,
			questions: questionsPayload.map((q) => ({
				questionId: q.questionId,
				order: q.order
			}))
		}
	}

	await redis.publish("match_created", JSON.stringify(payload))

	return payload
})