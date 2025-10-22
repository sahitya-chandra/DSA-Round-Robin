import prisma from "@repo/db";
import { Request, Response } from "express";

export const setQuestions = async (req: Request, res: Response) => {
	//easy
  const a = Math.floor(Math.random() * 34) + 1;
  const b = Math.floor(Math.random() * 34) + 1;
  console.log("a  and b ", a, " ", b);
  // //medium
  const c = Math.floor(Math.random() * 34) + 1;
  const d = Math.floor(Math.random() * 34) + 1;
  console.log("c and d ", c, " ", d);
  // //hard
  const e = Math.floor(Math.random() * 30);
  console.log("e ", e);
  //Duplicate NOT CHECKED ---------
  const ids: number[] = [1, 2, 3, 4, 5];
  try {
    const questionsFromDb = await prisma.question.findMany({
      where: { id: { in: ids } },
    });

    const questions: any[] = questionsFromDb.map((q: any) => ({
      ...q,
      testcases: q.testcases ?? [],
    }));

    console.log("questions", questions)
    res.status(200).json({ status: "success", questions });
  } catch (err: any) {
   res.status(500).json({ status: "failed in getting questions", error: err.message });
  }
}