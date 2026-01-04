import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MatchState {
  matchId: string | null;
  opponentId: string | null;
  opponent: { id: string; name: string } | null;
  questions: { questionData: any; order: number }[];
  setMatchData: (data: {
    matchId: string;
    opponentId: string;
    questions: { questionData: any; order: number }[];
    opponent?: { id: string; name: string };
  }) => void;
  startedAt: string | null;
  duration: number | null;
  setTiming: (startedAt: string, duration: number) => void;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  codeMap: Record<string, string>;
  updateCode: (key: string, code: string) => void;
  resetMatchData: () => void
}

export const useMatchStore = create<MatchState>()(
  persist(
    (set) => ({
      matchId: null,
      opponentId: null,
      opponent: null,
      questions: [],
      hydrated: false,
      startedAt: null,
      duration: null,
      codeMap: {},
      setHydrated: (v) => set({ hydrated: v }),
      setMatchData: (data) => set(data),
      setTiming: (startedAt, duration) => set({ startedAt, duration }),
      updateCode: (key, code) => set((state) => ({ 
        codeMap: { ...state.codeMap, [key]: code } 
      })),
      resetMatchData: () => set({ matchId: null, opponentId: null, opponent: null, questions: [], startedAt: null, duration: null, codeMap: {} })
    }),
    {
      name: "match-storage",
      partialize: (state) => ({
        matchId: state.matchId,
        opponentId: state.opponentId,
        opponent: state.opponent,
        questions: state.questions,
        startedAt: state.startedAt,
        duration: state.duration,
        hydrated: state.hydrated,
        codeMap: state.codeMap,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated(true);
      },
    }
  )
);
