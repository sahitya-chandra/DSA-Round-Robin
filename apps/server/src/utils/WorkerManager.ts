import { publisherClient, connection as redis } from "@repo/queue";

const BUSY_COUNT_KEY = "global_busy_count";
const WORKER_SIGNAL_CHANNEL = "worker_signal";

class WorkerManager {
  async incrementBusy() {
    const newVal = await redis.incr(BUSY_COUNT_KEY);
    console.log(`WorkerManager: Incremented busy count to ${newVal}`);
    if (newVal === 1) {
      console.log("WorkerManager: Publishing RESUME signal");
      await publisherClient.publish(WORKER_SIGNAL_CHANNEL, "RESUME");
    }
  }

  async decrementBusy() {
    const newVal = await redis.decr(BUSY_COUNT_KEY);
    console.log(`WorkerManager: Decremented busy count to ${newVal}`);
    if (newVal <= 0) {
      await redis.set(BUSY_COUNT_KEY, 0); // should not stay negative
      console.log("WorkerManager: Publishing PAUSE signal");
      await publisherClient.publish(WORKER_SIGNAL_CHANNEL, "PAUSE");
    }
  }
}

export const workerManager = new WorkerManager();
