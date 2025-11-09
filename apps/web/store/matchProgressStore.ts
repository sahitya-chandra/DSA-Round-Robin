import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlayerProgress {
	[qusetionId: string]: boolean
}

interface MatchProgressState {
	myProgress: PlayerProgress;
	opponentProgress: PlayerProgress;
	markSolved: (questionId: string, isOpponent?: boolean) => void
	resetProgress: () => void 
}

export const useMatchProgressStore = create<MatchProgressState>()(
  persist(
    (set) => ({
      myProgress: {},
      opponentProgress: {},
      markSolved: (qId, isOpponent = false) =>
        set((s) => {
          const key = isOpponent ? "opponentProgress" : "myProgress";
          return { ...s, [key]: { ...s[key], [qId]: true } };
        }),
      resetProgress: () => set({ myProgress: {}, opponentProgress: {} }),
    }),
    { name: "progress-storage" }
  )
);