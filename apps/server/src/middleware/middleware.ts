import fromNodeHeaders, { auth } from "@repo/auth"
import { NextFunction, Request, Response } from "express"

export const isActiveSession = async (req: Request, res: Response, next: NextFunction) => {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers)
	})

	if (!session || !session.user) {
		return res.status(401).json({error: "Unauthorized"})
	}

	(req as any).user = session.user;
	next()
}