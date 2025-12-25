import { create } from 'zustand';

interface MatchState {
  loading: boolean;
  queued: boolean;
  setLoading: (loading: boolean) => void;
  setQueued: (queued: boolean) => void;
}

export const useMatchStores = create<MatchState>((set) => ({
  loading: false,
  queued: false,
  setLoading: (loading) => set({ loading }),
  setQueued: (queued) => set({ queued }),
}));
