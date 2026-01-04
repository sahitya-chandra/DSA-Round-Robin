import { Hero } from "@/components/Landing/Hero";
import { Features } from "@/components/Landing/Features";
import { FAQ } from "@/components/Landing/FAQ";
import { Footer } from "@/components/Landing/Footer";

const Page = () => {

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Hero />
      <Features />
      <FAQ />
      <Footer />
    </main>
  );
};

export default Page;
