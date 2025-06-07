import { expect } from 'vitest';
import request from 'supertest';
import app from '../index';
import { TestAuthService } from './authService';
import { prisma } from '../lib/prisma';

// テスト用モックデータ
export const mockUsers = {
  valid: {
    email: 'test@example.com',
    password: 'TestPass123',
  },
  invalid: {
    email: 'invalid-email',
    password: '123', // 短すぎるパスワード
  },
  existing: {
    email: 'existing@example.com',
    password: 'ExistingPass123',
  },
};

// ユーザー作成ヘルパー
export const createTestUser = async (email = 'test@example.com', password = 'TestPass123') => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ email, password });

  return response.body.user;
};

// ログインヘルパー
export const loginTestUser = async (email = 'test@example.com', password = 'TestPass123') => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return response.body;
};

// 認証付きリクエストヘルパー
export const authenticatedRequest = (appInstance: any, token: string) => {
  return {
    get: (url: string) => request(appInstance).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => request(appInstance).post(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) => request(appInstance).put(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => request(appInstance).delete(url).set('Authorization', `Bearer ${token}`),
  };
};

// パスワードリセットトークン生成ヘルパー
export const createPasswordResetToken = async (email: string) => {
  // APIエンドポイントを使用してパスワードリセットを要求
  await request(app)
    .post('/api/auth/forgot-password')
    .send({ email });
  
  // テスト環境でのみ：データベースから最新のトークンを取得
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  
  const token = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, used: false },
    orderBy: { createdAt: 'desc' },
  });
  
  return token?.token;
};

// レスポンス検証ヘルパー（テスト環境でのみ使用）
export const expectValidAuthResponse = (response: any) => {
  expect(response.body).toHaveProperty('user');
  expect(response.body).toHaveProperty('token');
  expect(response.body.user).toHaveProperty('id');
  expect(response.body.user).toHaveProperty('email');
  expect(response.body.user).not.toHaveProperty('password');
  expect(typeof response.body.token).toBe('string');
};

export const expectValidUserResponse = (response: any) => {
  expect(response.body).toHaveProperty('id');
  expect(response.body).toHaveProperty('email');
  expect(response.body).not.toHaveProperty('password');
};

export const expectValidErrorResponse = (response: any, status: number) => {
  expect(response.status).toBe(status);
  expect(response.body).toHaveProperty('error');
  expect(typeof response.body.error).toBe('string');
};