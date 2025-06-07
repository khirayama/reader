import { beforeAll, afterAll, beforeEach } from 'vitest';
import { execSync } from 'node:child_process';
import { prisma } from '../lib/prisma';

// テスト用データベースセットアップ
beforeAll(async () => {
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
  try {
    await prisma.passwordResetToken.deleteMany();
    await prisma.article.deleteMany();
    await prisma.feed.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    console.error('Failed to cleanup test data:', error);
    throw error;
  }
});

// テスト終了後のクリーンアップ
afterAll(async () => {
  await prisma.$disconnect();
  console.log('Test database disconnected');
});