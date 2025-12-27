import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { 
    prisma: PrismaClient
}

const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
export * from '@prisma/client';
export type { Question } from '@prisma/client';