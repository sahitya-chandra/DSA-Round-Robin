import React from 'react';
import Link from 'next/link';

const Page = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-black via-gray-900 to-purple-900 text-white">
      <h1 className="text-5xl font-extrabold mb-8 tracking-wider text-cyan-400 drop-shadow-[0_0_10px_#00fff7]">
        Welcome to DSA Round_Robin
      </h1>
      <p className="mb-12 text-lg text-gray-400">
        Dive into challenges, code battles, and DSA duels in a cyber-themed world.
      </p>
      <Link
        href="/code"
        className="px-8 py-4 bg-pink-600 text-black font-bold rounded-lg shadow-[0_0_10px_#ff00ff] hover:scale-105 transition-transform"
      >
        Get Started
      </Link>
    </div>
  );
};

export default Page;
