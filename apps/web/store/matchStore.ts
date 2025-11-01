import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MatchState {
  matchId: string | null;
  opponentId: string | null;
  questions: { questionData: any; order: number }[];
  setMatchData: (data: {
    matchId: string;
    opponentId: string;
    questions: { questionData: any; order: number }[];
  }) => void;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
}

export const useMatchStore = create<MatchState>()(
  persist(
    (set) => ({
      matchId: null,
      opponentId: null,
      questions: [],
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      setMatchData: (data) => set(data),
    }),
    {
      name: "match-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
