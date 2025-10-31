import { create } from "zustand";

interface MatchState {
  matchId: string | null;
  opponentId: string | null;
  questions: { questionId: number; order: number }[];
  setMatchData: (data: {
    matchId: string;
    opponentId: string;
    questions: { questionId: number; order: number }[];
  }) => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  matchId: null,
  opponentId: null,
  questions: [],
  setMatchData: (data) => set(data),
}));
