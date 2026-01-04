import { Request, Response } from "express";
import prisma from "@repo/db";
import { connection as redis } from "@repo/queue";

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const cacheKey = "leaderboard_data";
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    const leaderboard = await prisma.leaderboardEntry.findMany({
      take: 100,
      orderBy: [
        { rating: "desc" },
        { winStreak: "desc" },
        { wins: "desc" },
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    // Cache for 30 seconds to prevent read storms
    await redis.set(cacheKey, JSON.stringify(formattedLeaderboard), "EX", 30);

    return res.status(200).json(formattedLeaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const seedLeaderboard = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        Matches: {
          include: {
            match: true
          }
        }
      }
    });

    let count = 0;

    for (const user of users) {
      let wins = 0;
      let losses = 0;
      let totalMatches = 0;
      let currentStreak = 0;
      let bestStreak = 0;
      let lastMatchAt = null;

      const sortedMatches = user.Matches.sort((a, b) => {
          const dateA = a.match.endedAt ? new Date(a.match.endedAt).getTime() : 0;
          const dateB = b.match.endedAt ? new Date(b.match.endedAt).getTime() : 0;
          return dateA - dateB;
      });

      for (const participant of sortedMatches) {
          if (participant.match.status !== "FINISHED") continue;
          
          totalMatches++;
          lastMatchAt = participant.match.endedAt;

          if (participant.match.winnerId === user.id) {
              wins++;
              currentStreak++;
              bestStreak = Math.max(bestStreak, currentStreak);
          } else if (participant.match.winnerId) {
              losses++;
              currentStreak = 0;
          } else {
               currentStreak = 0;
          }
      }

      await prisma.leaderboardEntry.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          rating: user.rating,
          wins,
          losses,
          totalMatches,
          winStreak: currentStreak,
          bestWinStreak: bestStreak,
          lastMatchAt
        },
        update: {
          rating: user.rating,
          wins,
          losses,
          totalMatches,
          winStreak: currentStreak,
          bestWinStreak: bestStreak,
          lastMatchAt
        }
      });
      count++;
    }

    return res.status(200).json({ message: `Leaderboard seeded successfully for ${count} users.` });
  } catch (error) {
    console.error("Error seeding leaderboard:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
