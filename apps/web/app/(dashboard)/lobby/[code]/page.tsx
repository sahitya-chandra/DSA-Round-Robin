"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Copy, Check, Crown, LogOut, Users, Loader2, Play } from "lucide-react";
import { useLobby } from "@/hooks/useLobby";

export default function LobbyRoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = String(params.code || "").toUpperCase();

  const { lobby, userId, fetchState, leaveRoom, startRoom } = useLobby({ listen: true });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      const state = await fetchState(code);
      if (!active) return;
      if (!state) {
        toast.error("Room not found");
        router.replace("/compete");
        return;
      }
      if (state.status === "STARTED" && state.matchId) {
        router.replace(`/code/${state.matchId}`);
        return;
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [userId, code]);

  const isHost = !!lobby && lobby.hostId === userId;
  const canStart = !!lobby && lobby.players.length >= lobby.minPlayers;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy code");
    }
  };

  const handleLeave = async () => {
    await leaveRoom(code);
    router.replace("/compete");
  };

  const handleStart = async () => {
    setStarting(true);
    const resp = await startRoom(code);
    if (!resp.ok) setStarting(false);
    // On success, the global match_started listener navigates to /code.
  };

  if (loading || !lobby) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-minecraft">Loading room...</p>
      </div>
    );
  }

  const emptySlots = Math.max(0, lobby.maxPlayers - lobby.players.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto"
    >
      {/* Room code header */}
      <div className="bg-card border-2 border-border pixel-border-outset minecraft-texture p-6 mb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-minecraft mb-3">
          Room Code
        </p>
        <button
          onClick={handleCopy}
          className="group inline-flex items-center gap-3 bg-muted px-6 py-3 pixel-border-inset cursor-pointer"
          title="Click to copy"
        >
          <span className="text-4xl font-black font-minecraft tracking-[0.3em] text-primary">
            {code}
          </span>
          {copied ? (
            <Check className="w-5 h-5 text-emerald-400" />
          ) : (
            <Copy className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
          )}
        </button>
        <p className="text-[11px] text-muted-foreground mt-3">
          Share this code so others can join.
        </p>
      </div>

      {/* Players */}
      <div className="bg-card border-2 border-border pixel-border-outset minecraft-texture p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            <h2 className="font-bold text-foreground font-minecraft">Players</h2>
          </div>
          <span className="text-sm font-bold font-minecraft text-muted-foreground">
            {lobby.players.length} / {lobby.maxPlayers}
          </span>
        </div>

        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {lobby.players.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-3 bg-muted px-4 py-3 pixel-border-inset"
              >
                <div className="w-9 h-9 bg-primary pixel-border-outset flex items-center justify-center text-primary-foreground font-bold font-minecraft">
                  {p.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <span className="font-semibold text-foreground truncate flex-1">
                  {p.name}
                </span>
                {p.id === userId && (
                  <span className="text-[10px] font-bold uppercase bg-accent/20 text-accent-foreground px-2 py-0.5 pixel-border-outset font-minecraft">
                    You
                  </span>
                )}
                {p.id === lobby.hostId && (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-yellow-500/20 text-yellow-500 px-2 py-0.5 pixel-border-outset font-minecraft">
                    <Crown className="w-3 h-3" /> Host
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {Array.from({ length: emptySlots }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-border/50 text-muted-foreground/50"
            >
              <div className="w-9 h-9 border-2 border-dashed border-border/50" />
              <span className="text-sm italic">Waiting for player...</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleLeave}
          className="flex items-center gap-2 px-5 py-3 text-destructive border-2 border-destructive pixel-border-outset active:pixel-border-inset font-minecraft font-bold cursor-pointer hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" /> Leave
        </button>

        {isHost ? (
          <motion.button
            whileHover={{ scale: canStart ? 1.02 : 1 }}
            whileTap={{ scale: canStart ? 0.98 : 1 }}
            onClick={handleStart}
            disabled={!canStart || starting}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-bold font-minecraft pixel-border-outset active:pixel-border-inset disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {starting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Starting...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {canStart
                  ? "Start Match"
                  : `Need ${lobby.minPlayers}+ players`}
              </>
            )}
          </motion.button>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-muted text-muted-foreground font-minecraft font-bold pixel-border-inset">
            <Loader2 className="w-4 h-4 animate-spin" /> Waiting for host to start...
          </div>
        )}
      </div>
    </motion.div>
  );
}
