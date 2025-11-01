import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import UserProfile from "@/components/UserProfile/userProfile";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { Btn } from "@/components/Btn";

const Page = async () => {

  const session = await auth.api.getSession({
    headers: await headers()
  })

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4">
     
      <h1 className="text-4xl sm:text-5xl font-bold mb-3 text-center text-cyan-300">
        Welcome to <span className="text-pink-400">DSA Round_Robin</span>
      </h1>

     
      <p className="text-gray-300 text-center max-w-md mb-8">
        Practice data structures, algorithms, and compete in DSA rounds.
      </p>

      <Btn userId={session?.user.id} />

      
      <div className="w-full max-w-sm mb-10">
        <UserProfile />
      </div>

      {/* CTA Button */}
      <Link href="/code">
        <Button
          variant="secondary"
          className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200"
        >
          Get Started
        </Button>
      </Link>
    </main>
  );
};

export default Page;
