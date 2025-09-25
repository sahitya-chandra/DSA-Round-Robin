import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { toNextJsHandler } from "better-auth/next-js";
import prisma from "@repo/db";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql", 
	}),
	emailAndPassword: { 
    enabled: true, 
  }, 

});

export const nextHandler = toNextJsHandler(auth);