import z from "zod";

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

export const formSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters long"' }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
});