import dotenv from 'dotenv';
dotenv.config({ path: "../../.env" });

export const PORT = process.env.SERVER_PORT || 5000;