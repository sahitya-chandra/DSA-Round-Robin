import { createCodeWorker } from "@repo/queue";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from 'dotenv';
dotenv.config();

createCodeWorker(async (job) => {
  const { code } = job.data;

	const tempDir = path.join(process.env.HOME || "/tmp", "docker_temp");
	if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

	const filePath = path.join(tempDir, `job-${job.id}.cpp`);
	fs.writeFileSync(filePath, code as string);

  console.log("C++ file created at:", filePath);

  const dockerCmd = `
    docker run --rm \
    -v ${filePath}:/code/main.cpp \
    --memory=128m --cpus=0.5 \
    gcc:latest bash -c '
      echo "=== Compiling ===";
      g++ /code/main.cpp -o /code/main 2>&1;
      COMPILATION_STATUS=$?;
      if [ $COMPILATION_STATUS -ne 0 ]; then
      echo "=== Compilation Failed ===";
      exit $COMPILATION_STATUS;
      fi
      echo "=== Running Program ===";
      /code/main
  '
  `;

 try {
    const result = await new Promise<string>((resolve, reject) => {
      exec(dockerCmd, 
        { timeout: 5000 }, 
        (err, stdout, stderr) => {
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
