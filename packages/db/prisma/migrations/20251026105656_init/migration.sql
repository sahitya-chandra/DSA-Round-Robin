/*
  Warnings:

  - Added the required column `matchId` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."MatchStatus" AS ENUM ('PENDING', 'RUNNING', 'FINISHED');

-- DropForeignKey
ALTER TABLE "public"."Submission" DROP CONSTRAINT "Submission_questionId_fkey";

-- AlterTable
ALTER TABLE "public"."Submission" ADD COLUMN     "matchId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."Match" (
    "id" TEXT NOT NULL,
    "status" "public"."MatchStatus" NOT NULL,
    "winnerId" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MatchParticipant" (
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "public"."MatchQuestion" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "questionId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "MatchQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchParticipant_userId_idx" ON "public"."MatchParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchParticipant_matchId_userId_key" ON "public"."MatchParticipant"("matchId", "userId");

-- CreateIndex
CREATE INDEX "Submission_matchId_questionId_idx" ON "public"."Submission"("matchId", "questionId");

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchParticipant" ADD CONSTRAINT "MatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchParticipant" ADD CONSTRAINT "MatchParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchQuestion" ADD CONSTRAINT "MatchQuestion_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
