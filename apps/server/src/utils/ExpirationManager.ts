import { finishMatchById } from "../helpers/finishMatch.helper";
import { connection as redis } from "@repo/queue";
import { MATCH_EXPIRATIONS_KEY } from "./constants";

class ExpirationManager {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  schedule(matchId: string, durationSeconds: number) {
    this.cancel(matchId);
    const delayMs = durationSeconds * 1000;
    
    console.log(`ExpirationManager: Scheduling timeout for match ${matchId} in ${durationSeconds}s`);
    
    const timer = setTimeout(async () => {
      console.log(`ExpirationManager: Match ${matchId} timed out`);
      try {
        await finishMatchById(matchId, { reason: "timeout" });
      } catch (err) {
        console.error(`ExpirationManager: Failed to finish match ${matchId}`, err);
      }
      this.timers.delete(matchId);
    }, delayMs);

    this.timers.set(matchId, timer);
  }

  cancel(matchId: string) {
    const timer = this.timers.get(matchId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(matchId);
      console.log(`ExpirationManager: Canceled timeout for match ${matchId}`);
    }
  }

  async recover() {
    console.log("ExpirationManager: Running recovery...");
    try {
      const now = Date.now();
      const expiredOrActive = await redis.zrangebyscore(MATCH_EXPIRATIONS_KEY, "-inf", "+inf", "WITHSCORES");
      
      for (let i = 0; i < expiredOrActive.length; i += 2) {
        const matchId = expiredOrActive[i] as string;
        const score = expiredOrActive[i + 1] as string;
        const expiresAt = parseInt(score);
        
        if (expiresAt <= now) {
          console.log(`ExpirationManager: Recovered expired match ${matchId}, finishing now`);
          await finishMatchById(matchId, { reason: "timeout" });
        } else {
          const delayRemaining = expiresAt - now;
          console.log(`ExpirationManager: Recovered active match ${matchId}, scheduling for ${delayRemaining / 1000}s`);
          this.schedule(matchId, delayRemaining / 1000);
        }
      }
    } catch (err) {
      console.error("ExpirationManager: Recovery failed", err);
    }
  }
}

export const expirationManager = new ExpirationManager();
