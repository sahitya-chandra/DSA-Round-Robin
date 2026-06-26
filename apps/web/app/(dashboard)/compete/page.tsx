"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, LogIn, Trophy, Minus } from "lucide-react";
import { useLobby } from "@/hooks/useLobby";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 10;

export default function CompetePage() {
  const { createRoom, joinRoom, userId } = useLobby();
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleCreate = async () => {
    if (!userId) return;
    setCreating(true);
    await createRoom(maxPlayers);
    setCreating(false);
  };

  const handleJoin = async () => {
    if (!userId) return;
    setJoining(true);
    await joinRoom(joinCode);
    setJoining(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto"
    >
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-yellow-500 pixel-border-outset flex items-center justify-center">
          <Trophy className="w-6 h-6 text-yellow-950" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-minecraft tracking-wide">
            Custom Lobby
          </h1>
          <p className="text-sm text-muted-foreground">
            Create a private room or join one with a code — invite anyone, no friends required.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Room */}
        <div className="bg-card border-2 border-border pixel-border-outset minecraft-texture p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground font-minecraft">Create Room</h2>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Host a new room and share the code. You decide how many players can join.
          </p>

          <div className="mb-6">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-minecraft mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" /> Max Players
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMaxPlayers((v) => Math.max(MIN_PLAYERS, v - 1))}
                disabled={maxPlayers <= MIN_PLAYERS}
                className="w-10 h-10 bg-secondary pixel-border-outset active:pixel-border-inset flex items-center justify-center disabled:opacity-40"
                aria-label="Decrease max players"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center bg-muted py-2.5 pixel-border-inset">
                <span className="text-2xl font-black font-minecraft text-foreground">
                  {maxPlayers}
                </span>
              </div>
              <button
                onClick={() => setMaxPlayers((v) => Math.min(MAX_PLAYERS, v + 1))}
                disabled={maxPlayers >= MAX_PLAYERS}
                className="w-10 h-10 bg-secondary pixel-border-outset active:pixel-border-inset flex items-center justify-center disabled:opacity-40"
                aria-label="Increase max players"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Between {MIN_PLAYERS} and {MAX_PLAYERS} players.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreate}
            disabled={creating}
            className="mt-auto w-full py-3 bg-primary text-primary-foreground font-bold font-minecraft pixel-border-outset active:pixel-border-inset disabled:opacity-50 cursor-pointer"
          >
            {creating ? "Creating..." : "Create Room"}
          </motion.button>
        </div>

        {/* Join Room */}
        <div className="bg-card border-2 border-border pixel-border-outset minecraft-texture p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <LogIn className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-foreground font-minecraft">Join Room</h2>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Got a code from a friend? Enter it below to jump into their room.
          </p>

          <div className="mb-6">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-minecraft mb-2 block">
              Room Code
            </label>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={6}
              placeholder="ABC123"
              className="w-full bg-muted px-4 py-3 pixel-border-inset text-center text-2xl font-black font-minecraft tracking-[0.4em] text-foreground placeholder:text-muted-foreground/40 uppercase outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleJoin}
            disabled={joining || joinCode.length < 4}
            className="mt-auto w-full py-3 bg-accent text-accent-foreground font-bold font-minecraft pixel-border-outset active:pixel-border-inset disabled:opacity-50 cursor-pointer"
          >
            {joining ? "Joining..." : "Join Room"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
