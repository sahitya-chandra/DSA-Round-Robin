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
  // let a = Math.floor(Math.random() * 210) + 1;
  // let b = Math.floor(Math.random() * 210) + 1;
  // console.log("a  and b ", a, " ", b);
  // //medium
  // let c = Math.floor(Math.random() * 60) + 1 + 210;
  // let d = Math.floor(Math.random() * 60) + 1 + 210;
  // console.log("c and d ", c, " ", d);
  // //hard
  // let e = Math.floor(Math.random() * 30) + 1 + 270;
  // console.log("e ", e);

  let a = 301, b = 302, c = 303, d = 304, e = 305
  let ids: number[] = [a, b, c, d, e];
  try {
    const questionsFromDb = await prisma.question.findMany({
      where: { id: { in: ids } },
    });

    const questions: any[] = questionsFromDb.map(q => ({
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
