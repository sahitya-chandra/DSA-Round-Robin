import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@repo/db";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailAndPassword: { 
    enabled: true, 
  },
  socialProviders: { 
    google: { 
      clientId: process.env.GOOGLE_CLIENT_ID as string, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
    }, 
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN ?? ".dsaroundrobin.fun"
    },
    useSecureCookies: process.env.NODE_ENV === 'production',
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === 'production' ? 'none': 'lax',
    },
  },
	trustedOrigins: ["https://www.dsaroundrobin.fun", "http://localhost:3000"],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await prisma.leaderboardEntry.create({
              data: {
                userId: user.id,
                rating: 1200,
                wins: 0,
                losses: 0,
                totalMatches: 0,
                winStreak: 0,
                bestWinStreak: 0,
              },
            });
            console.log(`Created leaderboard entry for user ${user.id}`);
          } catch (error) {
            console.error(`Failed to create leaderboard entry for user ${user.id}:`, error);
          }
        },
      },
    },
  },
});