export type Testcase = {
  input: string;
  expected_output: string;
};

export type questionSchema = {
  id : Number,
  category: String,
  difficulty: String,
  question: String,
  testcases: Testcase[]
}