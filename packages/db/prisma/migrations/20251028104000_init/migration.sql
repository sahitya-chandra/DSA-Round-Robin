/*
  Warnings:

  - The values [PENDING] on the enum `MatchStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."MatchStatus_new" AS ENUM ('WAITING', 'RUNNING', 'FINISHED');
ALTER TABLE "public"."Match" ALTER COLUMN "status" TYPE "public"."MatchStatus_new" USING ("status"::text::"public"."MatchStatus_new");
ALTER TYPE "public"."MatchStatus" RENAME TO "MatchStatus_old";
ALTER TYPE "public"."MatchStatus_new" RENAME TO "MatchStatus";
DROP TYPE "public"."MatchStatus_old";
COMMIT;
