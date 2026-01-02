"use server";

import prisma from "@repo/db";

export async function getProfileData(session: { user: { id: string }} | null) {

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
  const recentMatches = matches.map((match) => {
    const participant = match.participants.find((p) => p.userId === userId);
    const opponent = match.participants.find((p) => p.userId !== userId)?.user.name || "Unknown";
    const isWin = match.winnerId === userId;
    
    // Use the stored ratingChange if available, otherwise fallback to ±10
    const ratingChange = participant?.ratingChange ?? (isWin ? 10 : -10);
    const score = "N/A"; 

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
  const daysToCheck = 30; // Last 30 days

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

  // Fetch user submissions with question details for topic analysis
  const submissions = await prisma.submission.findMany({
    where: {
      userId: userId,
    },
    select: {
      id: true,
      questionId: true,
      status: true,
      createdAt: true,
    },
  });

  // Fetch all unique questions from submissions
  const questionIds = [...new Set(submissions.map(s => s.questionId))];
  const questions = await prisma.question.findMany({
    where: {
      id: {
        in: questionIds,
      },
    },
    select: {
      id: true,
      category: true,
      difficulty: true,
      question: true,
    },
  });

  // Create a map of questionId to question details
  const questionMap = new Map(questions.map(q => [q.id, q]));

  // Group submissions by topic and calculate success rates
  const topicAnalysis: Record<string, {
    total: number;
    failed: number;
    passed: number;
    failedQuestions: Array<{
      id: number;
      question: string;
      difficulty: string;
      attempts: number;
    }>;
    successRate: number;
  }> = {};

  // Track failed questions with attempt counts
  const failedQuestionsMap = new Map<number, number>();

  submissions.forEach((submission) => {
    const question = questionMap.get(submission.questionId);
    if (!question) return;

    const category = question.category;
    
    if (!topicAnalysis[category]) {
      topicAnalysis[category] = {
        total: 0,
        failed: 0,
        passed: 0,
        failedQuestions: [],
        successRate: 0,
      };
    }

    // Count as failed if status is not ACCEPTED/PASSED
    const isFailed = submission.status !== "ACCEPTED" && submission.status !== "PASSED";
    
    if (isFailed) {
      failedQuestionsMap.set(
        submission.questionId,
        (failedQuestionsMap.get(submission.questionId) || 0) + 1
      );
    }
  });

  // Get unique questions per topic
  const questionsByTopic = new Map<string, Set<number>>();
  submissions.forEach((submission) => {
    const question = questionMap.get(submission.questionId);
    if (!question) return;
    
    if (!questionsByTopic.has(question.category)) {
      questionsByTopic.set(question.category, new Set());
    }
    questionsByTopic.get(question.category)!.add(submission.questionId);
  });

  // Calculate stats per topic
  questionsByTopic.forEach((questionIds, category) => {
    const categoryQuestions = Array.from(questionIds);
    const failedInCategory = categoryQuestions.filter(qId => failedQuestionsMap.has(qId));
    const passedInCategory = categoryQuestions.filter(qId => !failedQuestionsMap.has(qId));

    topicAnalysis[category] = {
      total: categoryQuestions.length,
      failed: failedInCategory.length,
      passed: passedInCategory.length,
      failedQuestions: failedInCategory.map(qId => {
        const q = questionMap.get(qId)!;
        return {
          id: q.id,
          question: q.question,
          difficulty: q.difficulty,
          attempts: failedQuestionsMap.get(qId) || 0,
        };
      }),
      successRate: categoryQuestions.length > 0 
        ? Math.round((passedInCategory.length / categoryQuestions.length) * 100)
        : 0,
    };
  });

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
    topicAnalysis,
  };
}
