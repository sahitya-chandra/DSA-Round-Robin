import { Queue, Worker, Job, QueueEvents } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null
});

type CodeJob = { code: string | null };

export const codeQueue = new Queue<CodeJob>("code-execution", { connection });

export function createCodeWorker(
  processFn: (job: Job<CodeJob>) => Promise<any>
) {
  return new Worker<CodeJob>("code-execution", processFn, { connection });
}

export const queueEvents = new QueueEvents("code-execution", { connection });

