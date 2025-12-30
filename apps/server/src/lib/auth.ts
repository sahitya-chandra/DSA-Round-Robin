import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@repo/db";
import { CLIENT_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "../config/config";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	baseURL: process.env.BETTER_AUTH_URL,
	emailAndPassword: { 
    enabled: true, 
  },
  socialProviders: { 
    google: { 
      clientId: process.env.GOOGLE_CLIENT_ID as string, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
    }, 
  }, 
	trustedOrigins: [
		CLIENT_URL,
	],
	advanced: {
		crossSubDomainCookies: {
			enabled: true,
			domain: process.env.NODE_ENV === "production" ? ".dsaroundrobin.fun" : undefined,
		},
		cookieAttributes: {
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
		},
	},
});