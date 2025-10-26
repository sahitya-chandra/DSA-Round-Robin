import { Testcase } from "@repo/types";
import { Queue, Worker, Job, QueueEvents } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const connection = new IORedis(String(process.env.REDIS_URL), {
  maxRetriesPerRequest: null
});

type CodeJob = { code: string | null , language?: string, testcases: Testcase[]};

export const codeQueue = new Queue<CodeJob>("code-execution", { connection });
export const matchQueue = new Queue("create-match", { connection })

export function createCodeWorker(
  processFn: (job: Job<CodeJob>) => Promise<any>
) {
  return new Worker<CodeJob>("code-execution", processFn, { connection });
}

export function createMatchWorker(
  processFn: (job: Job) => Promise<any>
) {
  return new Worker("create-match", processFn, { connection })
}

export const queueEvents = new QueueEvents("code-execution", { connection });
export const matchEvents = new QueueEvents("create-match", { connection });


