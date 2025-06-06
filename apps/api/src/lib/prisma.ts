import { PrismaClient as ProductionPrismaClient } from '@prisma/client';

// テスト環境の場合はテスト用Prismaクライアントを使用
let prismaClient: any;

if (process.env.NODE_ENV === 'test') {
  try {
    const { PrismaClient: TestPrismaClient } = require('../../node_modules/.prisma/test-client');
    prismaClient = TestPrismaClient;
  } catch (error) {
    console.warn('Test Prisma client not found, falling back to production client');
    prismaClient = ProductionPrismaClient;
  }
} else {
  prismaClient = ProductionPrismaClient;
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: any | undefined;
}

export const prisma = globalThis.prisma || new prismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;