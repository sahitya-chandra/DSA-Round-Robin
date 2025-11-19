import React from "react";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { Hero } from "@/components/Landing/Hero";
import { Features } from "@/components/Landing/Features";
import { Footer } from "@/components/Landing/Footer";

const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30">
      <Hero userId={session?.user.id} />
      <Features />
      <Footer />
    </main>
  );
};

export default Page;
