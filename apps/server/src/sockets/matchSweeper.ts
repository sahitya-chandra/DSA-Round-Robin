import { connection as redis } from "@repo/queue";
import { finishMatchById } from "../helpers/finishMatch.helper";
import { ACTIVE_MATCH_PREFIX } from "../utils/constants";

const SWEEP_INTERVAL_MS = 60_000; // Sweep once per minute
 
 export function matchSweeper() {
 	setInterval(async () => {
 		try {
 			const now = Date.now();
       // Get matches that have expired (score <= now)
       const expiredMatchIds = await redis.zrangebyscore("match_expirations", "-inf", now);
 
 			for (const matchId of expiredMatchIds) {
         console.log(`Sweeper: finishing expired match ${matchId}`);
         await finishMatchById(matchId, { reason: "timeout" });
         // finishMatchById already handles zrem
 			}
 		} catch (err) {
 			console.error("Match sweeper error:", err);
 		}
 	}, SWEEP_INTERVAL_MS);
 }