import { connection as redis } from "@repo/queue";
import { finishMatchById } from "../helpers/finishMatch.helper";
import { ACTIVE_MATCH_PREFIX, MATCH_EXPIRY_SET } from "../utils/constants";

const SWEEP_INTERVAL_MS = 10_000;

export function matchSweeper() {
	setInterval(async () => {
		try {
      const now = Date.now();
      
      // Optimization: Get expired matches from Sorted Set (O(log(N)))
      const expiredMatchIds = await redis.zrangebyscore(MATCH_EXPIRY_SET, "-inf", now);

			for (const matchId of expiredMatchIds) {
          console.log(`Sweeper: finishing expired match ${matchId}`);
          // finishMatchById will handle ZREM from the set
          await finishMatchById(matchId, { reason: "timeout" });
			}
		} catch (err) {
			console.error("Match sweeper error:", err);
		}
	}, SWEEP_INTERVAL_MS);
}