import express from 'express'
import cors from 'cors';
import { PORT } from './config/config'
import { codeQueue } from "@repo/queue";

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

	const job = await codeQueue.add("run-code", { code })
	res.json({jobId: job.id, status: "queued" })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
})