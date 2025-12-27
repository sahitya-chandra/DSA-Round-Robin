import dotenv from 'dotenv';
dotenv.config({ path: "../../.env" });

export const PORT = process.env.SERVER_PORT || 5000;

export const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || "xyz"
export const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000"

// Support multiple origins for CORS (comma-separated)
const clientUrlEnv = process.env.CLIENT_URL || "http://localhost:3000";
export const CLIENT_URL = clientUrlEnv.includes(',') 
  ? clientUrlEnv.split(',').map(url => url.trim())
  : clientUrlEnv;
