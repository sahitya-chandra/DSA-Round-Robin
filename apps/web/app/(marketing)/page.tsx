import React from "react";
import { Hero } from "@/components/Landing/Hero";
import { Features } from "@/components/Landing/Features";
import { Footer } from "@/components/Landing/Footer";

const Page = async () => {
  // const session = await auth.api.getSession({
  //   headers: await headers(),
  // });

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Hero />
      <Features />
      <Footer />
    </main>
  );
};

export default Page;
