"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { authClient } from "@repo/auth";
import { Menu, X, User, MessageSquare, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/code", label: "Practice" },
  { href: "/friends", label: "Chats" },
];

export const Navbar = () => {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (v: string) => pathname === v;

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  return (
    <nav
      style={{ "--nav-height": "64px" } as React.CSSProperties}
      className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5"
    >
      <div
        className="container mx-auto px-4 md:px-6"
        style={{ height: "var(--nav-height)" }}
      >
        <div className="flex items-center justify-between h-full w-full">

          {/* ------------------------------- LOGO ------------------------------- */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-lg">
              RR
            </div>
            <span className="text-white font-semibold text-lg tracking-tight leading-none">
              DSA Round_Robin
            </span>
          </Link>

          {/* ---------------------------- NAV LINKS ---------------------------- */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(l.href)
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* -------------------- AUTH SECTION (FIXED WIDTH) ------------------- */}
          <div className="hidden md:flex items-center gap-4 min-w-[160px] justify-end">
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-10 w-10 p-0 rounded-full hover:bg-white/10"
                  >
                    <Avatar className="h-10 w-10 border border-white/10">
                      <AvatarImage src={session.user.image || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-purple-500 text-white">
                        {session.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-slate-900/95 border-slate-800"
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-white">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator className="bg-slate-800" />

                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    className="focus:bg-slate-800"
                  >
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => router.push("/friends")}
                    className="focus:bg-slate-800"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" /> Chats
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-slate-800" />

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-400 focus:bg-red-500/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/signin">
                  <Button
                    variant="ghost"
                    className="h-10 px-4 text-slate-300 hover:text-white hover:bg-white/10"
                  >
                    Sign In
                  </Button>
                </Link>

                <Link href="/signup">
                  <Button className="h-10 px-5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-purple-500/20 hover:opacity-90">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* ------------------------- MOBILE MENU BTN ------------------------- */}
          <button
            className="md:hidden p-2 text-slate-300 hover:text-white"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* --------------------------- MOBILE DROPDOWN --------------------------- */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-950 border-b border-slate-800 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-3 rounded-lg ${
                    isActive(l.href)
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {l.label}
                </Link>
              ))}

              <div className="pt-4 border-t border-slate-800">
                {session ? (
                  <div className="flex flex-col gap-2 px-4">
                    <Button
                      variant="ghost"
                      className="w-full h-11 justify-start text-slate-200 hover:text-white hover:bg-white/10"
                      onClick={() => {
                        router.push("/profile");
                        setOpen(false);
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full h-11 justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => {
                        handleSignOut();
                        setOpen(false);
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 px-4">
                    <Link href="/signin" onClick={() => setOpen(false)}>
                      <Button
                        variant="outline"
                        className="w-full h-11 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        Sign In
                      </Button>
                    </Link>

                    <Link href="/signup" onClick={() => setOpen(false)}>
                      <Button className="w-full h-11 bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
