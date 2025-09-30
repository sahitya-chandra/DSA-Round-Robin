import express from "express";
import cors from "cors";
import { PORT } from "./config/config";
import { codeQueue, queueEvents } from "@repo/queue";
import prisma from "@repo/db";
import { questionSchema } from "@repo/types";


const app = express();
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());

app.post("/api/submit", async (req, res) => {
  const { code, language } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Code are required" });
  }

  // return res.json({jobId: job.id, status: "queued" })

  try {
    const job = await codeQueue.add("run-code", { code, language });

    queueEvents
      .waitUntilReady()
      .then(() => {
        console.log("QueueEvents is ready", code, language);
      })
      .catch((err) => {
        console.error("Failed to connect QueueEvents:", err);
      });
    const result = await job.waitUntilFinished(queueEvents);

    return res.json({ status: "completed", jobId: job.id, result });
  } catch (err: any) {
    res.status(500).json({ status: "failed", error: err.message });
  }
});

app.get("/set-questions", async (req, res) => {
  //easy
  let a = Math.floor(Math.random() * 210) + 1;
  let b = Math.floor(Math.random() * 210) + 1;
  console.log("a  and b ", a, " ", b);
  //medium
  let c = Math.floor(Math.random() * 60) + 1 + 210;
  let d = Math.floor(Math.random() * 60) + 1 + 210;
  console.log("c and d ", c, " ", d);
  //hard
  let e = Math.floor(Math.random() * 30) + 1 + 270;
  console.log("e ", e);
  let ids: number[] = [a, b, c, d, e];
  try {
    let questions: questionSchema[] = [];
    questions = await prisma.question.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
    res.status(200).json({ status: "success", questions });
  } catch (err: any) {
   res.status(500).json({ status: "failed in getting questions", error: err.message });
  }
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
