import { Request, Response } from "express";
import { AuthRequest } from "../types/types";
import { matchEvents, matchQueue } from "@repo/queue";

export const matchController = async(req: AuthRequest, res: Response) => {
	const data = req.user

	if(!data || !data.id) {
		return res.status(400).json({error: "user obj is empty"})
	}

	try {
		const { id } = data
		const job = await matchQueue.add("match_queue", { 
			id
		})

		matchEvents
			.waitUntilReady()
			.then(() => console.log("MatchEvents is ready"))
			.catch((err: any) => console.error("MatchEvents failed:", err));

		const result = await job.waitUntilFinished(matchEvents);
		console.log("results", result)

		return res.json({ status: "completed", jobId: job.id, result: result })
	} catch (err: any) {
    res.status(500).json({ status: "failed", error: err.message });
	}
	
}