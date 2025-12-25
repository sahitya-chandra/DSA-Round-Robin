import { create } from "zustand";

interface MatchResultState {
  visible: boolean;
  winnerId: string | null;
  reason?: string;
  setResult: (winnerId: string | null, reason?: string) => void;
  hideResult: () => void;
}

export const useMatchResultStore = create<MatchResultState>((set) => ({
  visible: false,
  winnerId: null,
  reason: undefined,
  setResult: (winnerId, reason) => set({ visible: true, winnerId, reason }),
  hideResult: () => set({ visible: false, winnerId: null, reason: undefined }),
}));
