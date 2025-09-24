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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
})