// Prisma client singleton for Next.js
// This ensures we don't create multiple Prisma client instances in development

import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prismaOptions: any = {
  datasourceUrl: process.env.DATABASE_URL,
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Helper function to disconnect Prisma client (useful for serverless/edge)
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
