"use client";

import Link from "next/link";
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authClient } from "@repo/auth";

const UserProfile = () => {
  const { data: session, isPending } = authClient.useSession();
console.log("Session data:", session);
  if (isPending) {
    return (
      <Card className="w-full max-w-md mx-auto mt-10 p-6 text-center bg-gray-950 border-gray-800">
        <CardContent className="text-gray-400">Loading...</CardContent>
      </Card>
    );
  }

  const user = session?.user;

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto mt-10 p-6 text-center bg-gray-950 border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">
            Welcome 👋
          </CardTitle>
          <CardDescription className="text-gray-400">
            Sign in to view your profile and DSA stats
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <div>
            <Link href={"/signup"}>
              <Button className="mt-5 w-[100px] bg-blue-500">Sign Up</Button>
            </Link>
            <Link href={"/signin"}>
              <Button className="mt-5 ml-5 w-[100px] bg-blue-500">
                Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Example - fakee data
  const stats = {
    totalRounds:  18,
    totalFriends:   9,
    rating:  4,
  };

  const recentRounds =  [
    { name: "DSA Round #18", questions: 5, solved: 4, date: "2025-10-01" },
    { name: "DSA Round #17", questions: 5, solved: 5, date: "2025-09-28" },
    { name: "DSA Round #16", questions: 5, solved: 3, date: "2025-09-24" },
    { name: "DSA Round #15", questions: 5, solved: 5, date: "2025-09-20" },
    { name: "DSA Round #14", questions: 5, solved: 4, date: "2025-09-17" },
  ];

  return (
    <Card className="w-full max-w-md mx-auto mt-10 p-6 bg-gray-950 border border-gray-800 shadow-xl rounded-2xl text-white">
      
      <CardHeader className="flex flex-col items-center space-y-3">
        <CardTitle className="text-xl font-semibold">{user.name}</CardTitle>
        <p className="text-sm text-gray-400">{user.email}</p>
      </CardHeader>

    
      <CardContent className="space-y-6 text-center mt-4">
        <div className="flex justify-around">
          <div>
            <p className="text-gray-400 text-sm">Total Rounds</p>
            <p className="text-2xl font-bold text-white">{stats.totalRounds}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Friends</p>
            <p className="text-2xl font-bold text-white">
              {stats.totalFriends}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Rating</p>
            <p className="text-lg font-semibold">
              {[...Array(5)].map((_, i) => (
                <span key={i}>{i < stats.rating ? "⭐" : "☆"}</span>
              ))}
            </p>
          </div>
        </div>

        {/* Recent DSA Rounds */}
        <div className="text-left mt-6">
          <p className="font-semibold text-lg mb-3 text-center">
            Last 5 DSA Rounds
          </p>
          <div className="space-y-2">
            {recentRounds.map((round, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-gray-900 hover:bg-gray-800 transition-colors rounded-xl p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-white">{round.name}</p>
                  <p className="text-gray-400 text-xs">
                    {round.solved}/{round.questions} Solved
                  </p>
                </div>
                <span className="text-gray-500 text-xs">{round.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sign Out */}
        <Button
          variant="secondary"
          onClick={() => authClient.signOut()}
          className="w-full mt-6 bg-gray-800 hover:bg-gray-700 text-white"
        >
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
