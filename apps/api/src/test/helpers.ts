import request from 'supertest';
import app from '../index';
import { TestAuthService } from './authService';
import { testPrisma } from './prisma';

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
export const createTestUser = async (userData = mockUsers.valid) => {
  const response = await request(app)
    .post('/api/auth/register')
    .send(userData);

  return response;
};

// ログインヘルパー
export const loginTestUser = async (userData = mockUsers.valid) => {
  const response = await request(app)
    .post('/api/auth/login')
    .send(userData);

  return response;
};

// 認証付きリクエストヘルパー
export const authenticatedRequest = (token: string) => {
  return {
    get: (url: string) => request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => request(app).post(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) => request(app).put(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => request(app).delete(url).set('Authorization', `Bearer ${token}`),
  };
};

// パスワードリセットトークン生成ヘルパー
export const createPasswordResetToken = async (email: string) => {
  await TestAuthService.requestPasswordReset(email);
  
  // データベースから最新のトークンを取得（実際の実装では必要ない）
  const user = await testPrisma.user.findUnique({ where: { email } });
  if (!user) return null;
  
  const token = await testPrisma.passwordResetToken.findFirst({
    where: { userId: user.id, used: false },
    orderBy: { createdAt: 'desc' },
  });
  
  return token?.token;
};

// レスポンス検証ヘルパー（テスト環境でのみ使用）
export const expectValidAuthResponse = (response: any) => {
  return {
    hasUser: !!response.body?.user,
    hasToken: !!response.body?.token,
    hasValidUserProps: !!(response.body?.user?.id && response.body?.user?.email),
    tokenIsString: typeof response.body?.token === 'string',
  };
};

export const expectValidUserResponse = (response: any) => {
  return {
    hasRequiredProps: !!(response.body?.id && response.body?.email),
    noPasswordField: !response.body?.password,
  };
};

export const expectValidErrorResponse = (response: any, status: number) => {
  return {
    statusMatches: response.status === status,
    hasError: !!response.body?.error,
    errorIsString: typeof response.body?.error === 'string',
  };
};