import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
