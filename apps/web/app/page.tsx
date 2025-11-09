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
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-white px-6 py-16">
      {/* HEADER */}
      <section className="text-center max-w-3xl mb-12">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-5 leading-tight bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(236,72,153,0.25)]">
          Welcome to DSA Round_Robin
        </h1>
        <p className="text-gray-300 text-lg md:text-xl leading-relaxed tracking-wide">
          Practice <span className="text-cyan-400 font-medium">data structures</span>, sharpen your{" "}
          <span className="text-pink-400 font-medium">algorithmic skills</span>, and
          challenge your friends in real-time coding duels.
        </p>
      </section>

      {/* MATCH BUTTON */}
      <div className="mb-10">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition-all duration-500"></div>
          <div className="relative bg-gray-900/70 border border-gray-800 rounded-2xl px-8 py-4">
            <Btn userId={session?.user.id} />
          </div>
        </div>
      </div>

      {/* USER CARD
      <div className="w-full max-w-sm mb-14">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-600 via-cyan-600 to-pink-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition-all duration-500"></div>
          <div className="relative bg-gray-900/70 border border-gray-800 rounded-3xl p-5 backdrop-blur-xl">
            <UserProfile />
          </div>
        </div>
      </div> */}

      {/* NAVIGATION BUTTONS */}
      <div className="flex flex-wrap gap-5 justify-center">
        <Link href="/code">
          <Button className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-white rounded-2xl font-semibold text-lg shadow-lg transition-all duration-300 hover:shadow-cyan-400/40">
            Get Started
          </Button>
        </Link>

        <Link href="/friends">
          <Button className="px-8 py-3 bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-400 hover:to-fuchsia-400 text-white rounded-2xl font-semibold text-lg shadow-lg transition-all duration-300 hover:shadow-pink-500/40">
            Chats
          </Button>
        </Link>

        <Link href="/profile">
          <Button className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300 text-gray-900 rounded-2xl font-semibold text-lg shadow-lg transition-all duration-300 hover:shadow-yellow-500/40">
            Profile
          </Button>
        </Link>
      </div>

      {/* FOOTER GLOW */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60vw] h-48 bg-gradient-to-t from-fuchsia-600/20 to-transparent blur-3xl rounded-full pointer-events-none"></div>
    </main>
  );
};

export default Page;
