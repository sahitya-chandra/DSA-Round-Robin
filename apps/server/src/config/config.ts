import dotenv from 'dotenv';
dotenv.config({ path: "../../.env" });

export const PORT = process.env.SERVER_PORT || 5000;
export const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";