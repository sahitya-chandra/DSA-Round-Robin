import { create } from "zustand";

interface SubmissionResult {
  questionId: string;
  userId: string;
  result: {
    passed: boolean;
    passedCount: number;
    total: number;
    timeMs: number;
  };
  details: {
    input: string;
    expected: string;
    output: string;
    passed: boolean;
  }[];
}

interface SubmissionsState {
  submissions: Record<string, SubmissionResult>; 
  updateSubmission: (result: SubmissionResult) => void;
  resetSubmissions: () => void;
}

export const useSubmissionsStore = create<SubmissionsState>((set) => ({
  submissions: {},
  updateSubmission: (result) => 
    set((state) => ({
      submissions: {
        ...state.submissions,
        [result.questionId]: result,
      },
  })),

  resetSubmissions: () => set({submissions: {}})
}));
