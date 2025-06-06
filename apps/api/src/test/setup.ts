import { beforeAll, afterAll, beforeEach } from 'vitest';
import { execSync } from 'child_process';
import { testPrisma } from './prisma';

// テスト用データベースセットアップ
beforeAll(async () => {
  // テスト用環境変数設定
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';

  console.log('Setting up test database...');
  
  // テスト用データベースの初期化
  try {
    execSync('npx prisma db push --schema=prisma/schema.test.prisma --force-reset', {
      stdio: 'inherit',
    });
    console.log('Test database schema applied');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
});

// 各テスト前にデータベースをクリーンアップ
beforeEach(async () => {
  // テスト用データのクリーンアップ（順序重要：外部キー制約のため）
  await testPrisma.passwordResetToken.deleteMany();
  await testPrisma.article.deleteMany();
  await testPrisma.feed.deleteMany();
  await testPrisma.user.deleteMany();
});

// テスト終了後のクリーンアップ
afterAll(async () => {
  await testPrisma.$disconnect();
  console.log('Test database disconnected');
});