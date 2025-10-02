import express from "express";
import cors from "cors";
import { PORT } from "./config/config";
import { codeQueue, queueEvents } from "@repo/queue";
import prisma from "@repo/db";
import { Testcase } from "@repo/types";


const app = express();
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());

app.post("/api/submit", async (req, res) => {
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
});

app.get("/set-questions", async (req, res) => {
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
  const ids: number[] = [a, b, c, d, e];
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
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
