"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, Minus, HelpCircle } from "lucide-react";
import Script from "next/script";

const faqs = [
  {
    question: "Is DSA Round Robin free to use?",
    answer: "Yes! DSA Round Robin is completely free for all developers. You can practice solo, challenge friends, and climb the leaderboard without any cost."
  },
  {
    question: "Can I play with my friends?",
    answer: "Absolutely. You can creating a private lobby and invite your friends via a direct link to compete in real-time 1v1 coding battles."
  },
  {
    question: "What programming languages are supported?",
    answer: "We currently support the most popular languages for competitive programming, including Python, C++ and JavaScript."
  },
  {
    question: "How are the winners decided?",
    answer: "Winners are determined based on test cases passed and execution time. The player who solves the most test cases in the shortest time wins the round."
  }
];

const FAQItem = ({ faq, index }: { faq: typeof faqs[0], index: number }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="mb-4"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left p-6 bg-card border-2 transition-all duration-200 group relative
          ${isOpen ? 'border-primary pixel-border-inset' : 'border-border pixel-border-outset hover:bg-muted/50'}`}
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className={`font-minecraft text-sm md:text-base font-bold pr-8 transition-colors ${isOpen ? 'text-primary' : 'text-foreground'}`}>
            {faq.question}
          </h3>
          <div className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            {isOpen ? (
              <Minus className="w-5 h-5 text-primary" />
            ) : (
              <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
            )}
          </div>
        </div>
        
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? "max-h-48 opacity-100 mt-4" : "max-h-0 opacity-0"
          }`}
        >
          <p className="text-muted-foreground text-sm leading-relaxed border-t border-border/50 pt-4">
            {faq.answer}
          </p>
        </div>
      </button>
    </motion.div>
  );
};

export const FAQ = () => {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <section className="py-24 bg-background relative overflow-hidden minecraft-texture border-t-2 border-border">
      {/* Decorative Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="container px-4 md:px-6 relative z-10 max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-16 h-16 bg-accent pixel-border-outset mx-auto mb-6 flex items-center justify-center text-primary"
          >
            <HelpCircle className="w-8 h-8" />
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-foreground mb-4 font-minecraft tracking-tight"
          >
            Frequent Questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-muted-foreground text-lg"
          >
            Everything you need to know about the platform.
          </motion.p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem key={index} faq={faq} index={index} />
          ))}
        </div>
      </div>

      {/* Inject JSON-LD Schema */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </section>
  );
};
