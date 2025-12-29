import dotenv from 'dotenv';
dotenv.config({ path: "../../.env" });

export const PORT = process.env.SERVER_PORT || 5000;

export const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || "xyz"
export const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || "http://localhost:5000"

export const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

export const JUDGE0_URL = process.env.JUDGE0_URL || "https://judge0-ce.p.rapidapi.com";
export const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || "";