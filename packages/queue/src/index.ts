import { Testcase } from "@repo/types";
import { Queue, Worker, Job, QueueEvents } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";

export { Queue, Worker, Job, QueueEvents };

dotenv.config({ path: "../../.env" });

export const connection = new IORedis(String(process.env.REDIS_URL), {
  maxRetriesPerRequest: null
});

export const subscriberClient = connection.duplicate();
export const publisherClient = connection.duplicate();

export type CodeJob = { 
  code: string | null, 
  language?: string, 
  testcases: Testcase[], 
  matchId: string, 
  submissionId: string, 
  userId: string, 
  questionId: number 
};

export const codeQueue = new Queue<CodeJob>("code-execution", { connection });
 
const WORKER_OPTIONS = {
  connection,
  lockDuration: 300_000,   // 5 minutes
  stalledInterval: 300_000, // 5 minutes
  drainDelay: 0,          // instant processing when resumed
};
 
export function createCodeWorker(
  processFn: (job: Job<CodeJob>) => Promise<any>
) {
  return new Worker<CodeJob>("code-execution", processFn, WORKER_OPTIONS);
}
export const queueEvents = new QueueEvents("code-execution", { connection });
