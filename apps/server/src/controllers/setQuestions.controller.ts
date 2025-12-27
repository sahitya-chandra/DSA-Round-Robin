import prisma from "@repo/db";
import { Request, Response } from "express";

export const setQuestions = async (req: Request, res: Response) => {
  try {
    const randomQuestions = await prisma.$queryRaw<
      any[]
    >`SELECT * FROM "Question" ORDER BY RANDOM() LIMIT 5`;

    const questions = randomQuestions.map((q: any) => ({
      ...q,
      testcases: q.testcases ?? [],
    }));

    console.log("5 random questions:", questions);

    res.status(200).json({ status: "success", questions });
  } catch (err: any) {
    res.status(500).json({ status: "failed in getting random questions", error: err.message });
  }
};
