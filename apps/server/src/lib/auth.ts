import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@repo/db";
import { CLIENT_URL } from "../config/config";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailAndPassword: { 
    enabled: true, 
  }, 
	trustedOrigins: [
		CLIENT_URL,
  ],
});