import type { Metadata } from "next";
import { Inter, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { FriendInvitationListener } from "@/components/FriendInvitationListener";
import { GlobalChatListener } from "@/components/GlobalChatListener";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });
const minecraftFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-minecraft",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.dsaroundrobin.fun"),
  title: {
    default: "DSA Round Robin | Real-time Coding Battles",
    template: "%s | DSA Round Robin"
  },
  description: "Experience real-time coding battles, competitive programming, and 1v1 coding challenges. Improve your DSA skills, climb the leaderboard, and become a top developer.",
  keywords: [
    "DSA",
    "Data Structures",
    "Coding Battle",
    "Competitive Programming",
    "Round Robin",
    "Coding Interview",
    "LeetCode",
    "Real-time coding",
    "Multiplayer coding",
    "Coding Challenge",
    "Hackathon",
    "1v1 Coding",
    "Programming Contest",
    "Learn Coding",
    "Software Engineer",
    "Technical Interview",
    "Coding Practice",
    "Java",
    "Python",
    "C++",
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "System Design",
    "Frontend",
    "Backend"
  ],
  authors: [
    { name: "Divyanshu Chandra", url: "https://github.com/DIvyanshuVortex" },
    { name: "Sahitya Chandra", url: "https://github.com/sahitya-chandra" }
  ],
  creator: "Divyanshu Chandra & Sahitya Chandra",
  publisher: "DSA Round Robin",
  openGraph: {
    title: "DSA Round Robin | Real-time Coding Battles",
    description: "Battle against friends or strangers in real-time coding challenges. Master Data Structures and Algorithms in a fun, competitive environment.",
    url: "https://www.dsaroundrobin.fun",
    siteName: "DSA Round Robin",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/custom-favicon.png",
        width: 1200,
        height: 630,
        alt: "DSA Round Robin Logo",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DSA Round Robin | Real-time Coding Battles",
    description: "Join the ultimate coding battleground. Real-time 1v1 challenges, leaderboards, and more.",
    images: ["/custom-favicon.png"],
  },
  icons: {
    icon: [
      { url: "/custom-favicon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    shortcut: ["/custom-favicon.png"],
    apple: [
      { url: "/custom-favicon.png", type: "image/png" }
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} ${minecraftFont.variable}`}>
        <FriendInvitationListener />
        <GlobalChatListener />
        {children}
        <Toaster />
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "DSA Round Robin",
              "image": "https://www.dsaroundrobin.fun/custom-favicon.png",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              },
              "description": "A free real-time competitive programming platform for developers to practice Data Structures and Algorithms.",
              "author": [
                {
                  "@type": "Person",
                  "name": "Divyanshu Chandra",
                  "url": "https://github.com/DIvyanshuVortex"
                },
                {
                  "@type": "Person",
                  "name": "Sahitya Chandra",
                  "url": "https://github.com/sahitya-chandra"
                }
              ]
            })
          }}
        />
      </body>
    </html>
  );
}
