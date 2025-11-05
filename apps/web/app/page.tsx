import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import UserProfile from "@/components/UserProfile/userProfile";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { Btn } from "@/components/Btn";

const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-white px-6 py-12">
      <section className="text-center max-w-2xl">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-500">
          Welcome to DSA Round_Robin
        </h1>

        <p className="text-gray-300 text-lg md:text-xl mb-10 leading-relaxed">
          Practice data structures, algorithms, and challenge your friends in real-time DSA rounds.
        </p>
      </section>

      <div className="mb-8">
        <Btn userId={session?.user.id} />
      </div>

      <div className="w-full max-w-sm mb-12">
        <UserProfile />
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/code">
          <Button className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-semibold text-lg shadow-lg transition-all duration-200 hover:shadow-cyan-500/30">
            Get Started
          </Button>
        </Link>

        <Link href="/friends">
          <Button className="px-8 py-3 bg-pink-400 hover:bg-pink-500 text-white rounded-xl font-semibold text-lg shadow-lg transition-all duration-200 hover:shadow-pink-500/30">
            Chats
          </Button>
        </Link>
      </div>
    </main>
  );
};

export default Page;
