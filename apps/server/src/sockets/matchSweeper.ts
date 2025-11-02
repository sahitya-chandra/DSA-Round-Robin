import { connection as redis ,ACTIVE_MATCH_PREFIX } from "@repo/queue";
import { finishMatchById } from "../helpers/finishMatch.helper";

const SWEEP_INTERVAL_MS = 30_000;

export function matchSweeper() {
	setInterval(async () => {
		try {
			const keys = await redis.keys(`${ACTIVE_MATCH_PREFIX}*`);
			const now = new Date()
			for (const key of keys) {
				const raw = await redis.hgetall(key)
				if (!raw || !raw.expiresAt) continue
				const expiresAt = new Date(raw.expiresAt).getTime()
				if (expiresAt <= Number(now) && raw.status === "RUNNING") {
					const matchId = key.replace(ACTIVE_MATCH_PREFIX, "")
					console.log(`Sweeper: finishing expired match ${matchId}`);
          await finishMatchById(matchId, { reason: "timeout" });
				}
			}
		} catch (err) {
			console.error("Match sweeper error:", err);
		}
	}, SWEEP_INTERVAL_MS);
}