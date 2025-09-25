import express from 'express'
import cors from 'cors';
import { PORT } from './config/config'
import { codeQueue, queueEvents } from "@repo/queue";

const app = express()
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());

app.post("/api/submit", async (req, res) => {
	const { code } = req.body
	if (!code) {
    return res.status(400).json({ error: "Code are required" });
  }

	// return res.json({jobId: job.id, status: "queued" })
  
  try {
    const job = await codeQueue.add("run-code", { code })

    queueEvents.waitUntilReady().then(() => {
      console.log("QueueEvents is ready");
    }).catch((err) => {
      console.error("Failed to connect QueueEvents:", err);
    });
    const result = await job.waitUntilFinished(queueEvents);

    return res.json({ status: "completed", jobId: job.id, result });
  } catch (err: any) {
    res.status(500).json({ status: "failed", error: err.message });
  }
})

// app.get("/api/result/:id", async (req, res) => {
//   const job = await codeQueue.getJob(req.params.id);

//   if (!job) {
//     return res.status(404).json({ error: "Job not found" });
//   }

//   const state = await job.getState();
//   const result = await job.returnvalue;

//   return res.json({ state, result });

  // if (await job.isCompleted()) {
  //   return res.json({ status: "completed", result: await job.returnvalue });
  // }

  // if (await job.isFailed()) {
  //   return res.json({ status: "failed", error: job.failedReason });
  // }

  // return res.json({ status: "pending" });
// });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
})