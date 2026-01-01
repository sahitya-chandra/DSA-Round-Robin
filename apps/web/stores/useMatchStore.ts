import { create } from 'zustand';

interface MatchState {
  loading: boolean;
  queued: boolean;
  matchFound: boolean;
  setLoading: (loading: boolean) => void;
  setQueued: (queued: boolean) => void;
  setMatchFound: (matchFound: boolean) => void;
}

export const useMatchStores = create<MatchState>((set) => ({
  loading: false,
  queued: false,
  matchFound: false,
  setLoading: (loading) => set({ loading }),
  setQueued: (queued) => set({ queued }),
  setMatchFound: (matchFound) => set({ matchFound }),
}));
