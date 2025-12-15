"use server";

import { auth } from "@repo/auth";
import prisma from "@repo/db";
import { headers } from "next/headers";

export async function getProfileData() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const userId = session.user.id;

  // Fetch user details including rating
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      rating: true,
    },
  });

  if (!user) return null;

  // Fetch matches where the user participated
  const matches = await prisma.match.findMany({
    where: {
      participants: {
        some: {
          userId: userId,
        },
      },
      status: "FINISHED",
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50, // Limit to last 50 matches for stats calculation
  });

  // Calculate stats
  const matchesPlayed = matches.length;
  const wins = matches.filter((m) => m.winnerId === userId).length;
  const losses = matchesPlayed - wins; // Assuming no draws for now
  const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

  // Calculate streak
  let currentStreak = 0;
  for (const match of matches) {
    if (match.winnerId === userId) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Format recent matches for UI
  const recentMatches = matches.slice(0, 5).map((match) => {
    const opponent = match.participants.find((p) => p.userId !== userId)?.user.name || "Unknown";
    const isWin = match.winnerId === userId;
    
    // Mock score and rating change for now as they are not in the schema explicitly per match
    // In a real scenario, we'd need to store score and rating change in MatchParticipant or Match
    const score = "N/A"; 
    const ratingChange = isWin ? 10 : -10; // Placeholder logic

    return {
      id: match.id,
      opponent,
      result: isWin ? "Win" : "Loss",
      date: match.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      score,
      ratingChange,
    };
  });

  // Calculate activity (matches per day)
  const activityMap = new Map<string, number>();
  const today = new Date();
  const daysToCheck = 84; // 12 weeks

  // Initialize map with 0
  for (let i = 0; i < daysToCheck; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split("T")[0] || "";
    activityMap.set(dateStr, 0);
  }

  // Populate with actual data
  matches.forEach((match) => {
    const dateStr = match.createdAt.toISOString().split("T")[0] || "";
    if (activityMap.has(dateStr)) {
      activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
    }
  });

  const activity = Array.from(activityMap.entries())
    .map(([date, count]) => ({ date, count }))
    .reverse();

  return {
    user: {
      name: user.name,
      rating: user.rating,
      createdAt: user.createdAt,
      activeDays: activity.filter((d) => d.count > 0).length,
    },
    stats: {
      matchesPlayed,
      wins,
      losses,
      rating: user.rating,
      winRate,
      winStreak: currentStreak,
      bestRating: user.rating, // Placeholder, ideally we track max rating
    },
    matches: recentMatches,
    activity,
  };
}
