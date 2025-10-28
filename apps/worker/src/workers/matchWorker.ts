import prisma, { MatchStatus, Prisma, Question } from "@repo/db";
import { createMatchWorker, publisherClient } from "@repo/queue";

createMatchWorker(async (job) => {
  const { userId: requesterId } = job.data as { userId: string };
  console.log("Job data:", job.data);

  let matchId: string | undefined;
  let opponentId: string | undefined
  let status: MatchStatus = MatchStatus.WAITING;
  let questionsPayload: Array<{ questionId: number; order: number }> = [];

  try {
    await prisma.$transaction(
      async (tx) => {
        // Lock one waiting match that:
        //  - has exactly 1 participant
        //  - does not already include the requester
        //  - pick the oldest by createdAt
        const lockedMatch = await tx.$queryRaw<
          Array<{ id: string; participantUserId: string }>
        >(Prisma.sql`
          SELECT m.id, mp."userId" AS "participantUserId"
          FROM "Match" m
          JOIN "MatchParticipant" mp ON mp."matchId" = m.id
          WHERE m.status = ${Prisma.sql`${MatchStatus.WAITING}::"MatchStatus"`}
            AND m.id NOT IN (
              SELECT "matchId" FROM "MatchParticipant" WHERE "userId" = ${requesterId}
            )
            AND (
              SELECT COUNT(*) FROM "MatchParticipant" WHERE "matchId" = m.id
            ) = 1
          ORDER BY m."createdAt" ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED;
        `);

        if (lockedMatch.length > 0) {
          const match = lockedMatch[0]
          const participantUserId = match?.participantUserId;
          matchId = match?.id;
          opponentId = participantUserId;

          await tx.matchParticipant.create({
            data: {
              matchId: matchId!,
              userId: requesterId,
            },
          });

          const updated = await tx.match.update({
            where: { id: matchId },
            data: {
              status: MatchStatus.RUNNING,
              startedAt: new Date(),
            },
          });

          status = updated.status;
          console.log("Joined existing match:", matchId);
        } else {
          const newMatch = await tx.match.create({
            data: { status: MatchStatus.WAITING, createdAt: undefined },
          });
          matchId = newMatch.id;

          await tx.matchParticipant.create({
            data: {
              matchId,
              userId: requesterId,
            },
          });

          status = MatchStatus.WAITING;
          console.log("Created new match:", matchId);
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000,
      }
    );

    // @ts-ignore
    if (status === MatchStatus.RUNNING && matchId) {
      const questions = (await prisma.$queryRaw<Question[]>`
        SELECT * FROM "Question" ORDER BY RANDOM() LIMIT 5;
      `);

      const mqData = questions.map((q, idx) => ({
        matchId: matchId!,
        questionId: q.id,
        order: idx + 1,
      }));

      await prisma.matchQuestion.createMany({ data: mqData });

      questionsPayload = mqData.map((q) => ({
        questionId: q.questionId,
        order: q.order,
      }));
    }

    const payload = {
      event: "match_started",
      data: {
        matchId,
        status,
        requesterId,
        opponentId,
        questions: questionsPayload,
      },
    };

    console.log("Publishing match:", payload);
    await publisherClient.publish("match_created", JSON.stringify(payload));

    return payload;
  } catch (err) {
    console.error("Transaction or Worker Error:", err);
    throw err;
  }
});
