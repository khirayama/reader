import { PrismaClient } from '../../node_modules/.prisma/test-client';

declare global {
  // biome-ignore lint/style/noVar: グローバル変数の定義のため必要
  var testPrisma: PrismaClient | undefined;
}

export const testPrisma: any = globalThis.testPrisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.testPrisma = testPrisma;
}

export default testPrisma;