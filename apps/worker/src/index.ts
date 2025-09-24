import { createCodeWorker } from "@repo/queue";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from 'dotenv';
dotenv.config();

createCodeWorker(async (job) => {
  const { code } = job.data;

	const tempDir = path.join(String(process.env.HOME), "docker_temp");
	if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

	const filePath = path.join(tempDir, `job-${job.id}.cpp`);
	fs.writeFileSync(filePath, code as string);

  console.log("Mount directory:", tempDir);
  console.log("C++ file created at:", filePath);

  const dockerCmd = `docker run --rm -v ${tempDir}:/code --memory=128m --cpus=0.5 gcc:latest bash -c "g++ /code/job-${job.id}.cpp -o /code/main && /code/main"`;

 try {
    const result = await new Promise<string>((resolve, reject) => {
      exec(dockerCmd, 
        { timeout: 10000 }, 
        (err, stdout, stderr) => {
        console.log('STDOUT:', stdout);
        console.log('STDERR:', stderr);
        if (err) return reject(stderr || err.message);
        resolve(stdout || stderr);
      });
    });
    console.log("=== Full Output ===\n", result);
    return result;
  } catch (err) {
    console.log("Error during execution:", err);
    throw err;
  } finally {
    try {
      fs.unlinkSync(filePath);
      console.log("Deleted temp file:", filePath);
    } catch (e) {
      console.warn("Failed to delete temp file:", filePath);
    }
  }
});
