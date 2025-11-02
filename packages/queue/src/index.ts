import { Testcase } from "@repo/types";
import { Queue, Worker, Job, QueueEvents } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

export const connection = new IORedis(String(process.env.REDIS_URL), {
  maxRetriesPerRequest: null
});

export const subscriberClient = connection.duplicate();
export const publisherClient = connection.duplicate();

type CodeJob = { code: string | null , language?: string, testcases: Testcase[], matchId: string, submissionId: string, userId: string, questionId: number};

export const codeQueue = new Queue<CodeJob>("code-execution", { connection });

export function createCodeWorker(
  processFn: (job: Job<CodeJob>) => Promise<any>
) {
  return new Worker<CodeJob>("code-execution", processFn, { connection });
}
export const queueEvents = new QueueEvents("code-execution", { connection });

export const WAITING_LIST = "waiting_users";
export const USER_MATCH_PREFIX = "user_match:";
export const ACTIVE_MATCH_PREFIX = "active_match:";