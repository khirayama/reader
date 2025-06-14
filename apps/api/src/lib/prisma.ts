import { PrismaClient as ProductionPrismaClient } from '@prisma/client'

// テスト環境の場合はテスト用Prismaクライアントを使用
// biome-ignore lint/suspicious/noExplicitAny: Prismaクライアントの動的インポートのため必要
let prismaClient: any

if (
  process.env.NODE_ENV === 'test' ||
  (process.env.NODE_ENV === 'development' && process.env.DATABASE_URL?.includes('file:'))
) {
  try {
    // biome-ignore lint/style/useNodejsImportProtocol: 動的requireのため
    const { PrismaClient: TestPrismaClient } = require('../../node_modules/.prisma/test-client')
    prismaClient = TestPrismaClient
  } catch (error) {
    console.warn('Test Prisma client not found, falling back to production client')
    prismaClient = ProductionPrismaClient
  }
} else {
  prismaClient = ProductionPrismaClient
}

declare global {
  // biome-ignore lint/style/noVar: グローバル変数の定義のため必要
  // biome-ignore lint/suspicious/noExplicitAny: Prismaクライアントの動的型のため必要
  var prisma: any | undefined
}

export const prisma = globalThis.prisma || new prismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export default prisma
