import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: process.env.NEXT_PUBLIC_API_URL + '/api/auth/:path*',
      },
    ];
  },
};

export default nextConfig;
