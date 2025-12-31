import type { Metadata } from "next";
import { Inter, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { FriendInvitationListener } from "@/components/FriendInvitationListener";

const inter = Inter({ subsets: ["latin"] });
const minecraftFont = Press_Start_2P({ 
  weight: "400",
  subsets: ["latin"],
  variable: "--font-minecraft",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DSA Round_Robin",
  description: "Real-time coding battles",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} ${minecraftFont.variable}`}>
        {children}
        <Toaster />
        <FriendInvitationListener />
      </body>
    </html>
  );
}
