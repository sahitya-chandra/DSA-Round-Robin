import prisma from "@repo/db";
import { Request, Response } from "express";

export const setQuestions = async (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: "ids must be an array" });
  }

  try {
    const questionsFromDb = await prisma.question.findMany({
      where: { id: { in: ids } },
    });

    const questions = questionsFromDb.map((q) => ({
      ...q,
      testcases: q.testcases ?? [],
    }));

    console.log("questions", questions)
    res.status(200).json({ status: "success", questions });
  } catch (err: any) {
    res.status(500).json({ status: "failed in getting questions", error: err.message });
  }
}