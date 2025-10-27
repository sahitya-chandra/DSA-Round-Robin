import { Request, Response } from "express";
import { AuthRequest } from "../types/types";
import { matchQueue } from "@repo/queue";

export const matchController = async(req: AuthRequest, res: Response) => {
	const data = req.user

	if(!data || !data.id) return res.status(400).json({error: "user obj is empty"})

	try {
		const { id: userId } = data
		await matchQueue.add("match_queue", { userId })
		return res.json({ status: "searching" })
	} catch (err: any) {
    res.status(500).json({ status: "failed", error: err.message });
	}
	
}