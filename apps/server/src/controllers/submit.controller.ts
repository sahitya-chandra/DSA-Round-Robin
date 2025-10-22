import prisma from "@repo/db";
import { codeQueue, queueEvents } from "@repo/queue";
import { Testcase } from "@repo/types";
import { Request, Response } from "express";

export const submitCode = async (req: Request, res: Response) => {
	const {id, code, language } = req.body;
  if (!code || !id) {
    return res.status(400).json({ error: "Code or id are missing" });
  }

  // return res.json({jobId: job.id, status: "queued" })

  try {
    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question) return res.status(404).json({ error: "Question not found" });

    const job = await codeQueue.add("run-code", {
      code,
      language,
      testcases: question?.testcases as Testcase[],
    });

    queueEvents
      .waitUntilReady()
      .then(() => console.log("QueueEvents is ready"))
      .catch((err: any) => console.error("QueueEvents failed:", err));

    const result = await job.waitUntilFinished(queueEvents);
    console.log("resuslet", result)
    return res.json({ status: "completed", jobId: job.id, results: result });
  } catch (err: any) {
    res.status(500).json({ status: "failed", error: err.message });
  }
}