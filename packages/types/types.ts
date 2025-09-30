export type TestCase = {
input : [Number],
expected_output : [Number]
}

export type questionSchema = {
  id : Number,
  category: String,
  difficulty: String,
  question: String,
  testcases: [TestCase]
}