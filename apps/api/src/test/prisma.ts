import { PrismaClient } from '../../node_modules/.prisma/test-client';

declare global {
  // eslint-disable-next-line no-var
  var testPrisma: PrismaClient | undefined;
}

export const testPrisma = globalThis.testPrisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.testPrisma = testPrisma;
}

export default testPrisma;