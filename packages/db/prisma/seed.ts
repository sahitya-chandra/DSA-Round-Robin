import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Direct relative path
const filePath = path.join(process.cwd(), 'prisma', 'questions.json');

async function main() {
  const jsonData = fs.readFileSync(filePath, 'utf-8');
  const questions = JSON.parse(jsonData);

  for (const q of questions) {
    await prisma.question.create({
      data: {
        category: q.category,
        difficulty: q.difficulty,
        question: q.question,
        testcases: q.testcases
      }
    });
  }

  console.log('✅ Seeded all questions from JSON.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
