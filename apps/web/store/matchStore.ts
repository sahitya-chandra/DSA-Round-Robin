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
  startedAt: string | null;
  duration: number | null;
  setTiming: (startedAt: string, duration: number) => void;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  resetMatchData: () => void
}

export const useMatchStore = create<MatchState>()(
  persist(
    (set) => ({
      matchId: null,
      opponentId: null,
      questions: [],
      hydrated: false,
      startedAt: null,
      duration: null,
      setHydrated: (v) => set({ hydrated: v }),
      setMatchData: (data) => set(data),
      setTiming: (startedAt, duration) => set({ startedAt, duration }),
      resetMatchData: () => set({ matchId: null, opponentId: null, questions: [], startedAt: null, duration: null })
    }),
    {
      name: "match-storage",
      partialize: (state) => ({
        matchId: state.matchId,
        opponentId: state.opponentId,
        questions: state.questions,
        startedAt: state.startedAt,
        duration: state.duration,
        hydrated: state.hydrated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated(true);
      },
    }
  )
);
