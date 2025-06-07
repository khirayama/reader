import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index';
import { prisma } from '../../lib/prisma';
import {
  mockUsers,
  createTestUser,
  createTestUserWithData,
  loginTestUser,
  authenticatedRequest,
  createPasswordResetToken,
  expectValidAuthResponse,
  expectValidUserResponse,
  expectValidErrorResponse,
} from '../../test/helpers';

describe('認証API', () => {
  describe('POST /api/auth/register', () => {
    it('有効なデータでユーザー登録が成功する', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(mockUsers.valid);

      expect(response.status).toBe(201);
      expectValidAuthResponse(response);
      expect(response.body.user.email).toBe(mockUsers.valid.email);
    });

    it('無効なメールアドレスで登録が失敗する', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'ValidPass123',
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    it('弱いパスワードで登録が失敗する', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    it('重複したメールアドレスで登録が失敗する', async () => {
      // 最初のユーザーを登録
      await createTestUser(mockUsers.valid.email, mockUsers.valid.password);

      // 同じメールアドレスで再度登録
      const response = await request(app)
        .post('/api/auth/register')
        .send(mockUsers.valid);

      expect(response.status).toBe(400);
      expectValidErrorResponse(response, 400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // テスト用ユーザーを作成
      await createTestUser(mockUsers.valid.email, mockUsers.valid.password);
    });

    it('有効な認証情報でログインが成功する', async () => {
      const response = await loginTestUser(mockUsers.valid.email, mockUsers.valid.password);

      expect(response.status).toBe(200);
      expectValidAuthResponse(response);
      expect(response.body.user.email).toBe(mockUsers.valid.email);
    });

    it('存在しないメールアドレスでログインが失敗する', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'ValidPass123',
        });

      expect(response.status).toBe(401);
      expectValidErrorResponse(response, 401);
    });

    it('間違ったパスワードでログインが失敗する', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUsers.valid.email,
          password: 'WrongPassword123',
        });

      expect(response.status).toBe(401);
      expectValidErrorResponse(response, 401);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('認証されたユーザーがプロフィールを取得できる', async () => {
      const registerResponse = await createTestUser();
      const loginResult = await loginTestUser();
      const token = loginResult.body.token;

      const response = await authenticatedRequest(token).get('/api/auth/profile');

      expect(response.status).toBe(200);
      expectValidUserResponse(response);
      expect(response.body.email).toBe(mockUsers.valid.email);
    });

    it('未認証のリクエストで401エラーが返される', async () => {
      const response = await request(app).get('/api/auth/profile');

      expect(response.status).toBe(401);
      expectValidErrorResponse(response, 401);
    });

    it('無効なトークンで401エラーが返される', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expectValidErrorResponse(response, 401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await createTestUser(mockUsers.valid.email, mockUsers.valid.password);
    });

    it('有効なメールアドレスでパスワードリセット要求が成功する', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: mockUsers.valid.email });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('存在しないメールアドレスでも成功レスポンスが返される（セキュリティ対策）', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    beforeEach(async () => {
      await createTestUser(mockUsers.valid.email, mockUsers.valid.password);
    });

    it('有効なトークンでパスワードリセットが成功する', async () => {
      const resetToken = await createPasswordResetToken(mockUsers.valid.email);
      
      if (!resetToken) {
        throw new Error('Reset token could not be created');
      }

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // 新しいパスワードでログインできることを確認
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUsers.valid.email,
          password: 'NewPassword123',
        });

      expect(loginResponse.status).toBe(200);
    });

    it('無効なトークンでパスワードリセットが失敗する', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword123',
        });

      expect(response.status).toBe(400);
      expectValidErrorResponse(response, 400);
    });
  });

  describe('PUT /api/auth/password', () => {
    it('認証されたユーザーがパスワードを変更できる', async () => {
      const registerResponse = await createTestUserWithData(mockUsers.valid);
      const token = registerResponse.body.token;

      const response = await authenticatedRequest(token)
        .put('/api/auth/password')
        .send({
          currentPassword: mockUsers.valid.password,
          newPassword: 'NewPassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // 新しいパスワードでログインできることを確認
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUsers.valid.email,
          password: 'NewPassword123',
        });

      expect(loginResponse.status).toBe(200);
    });

    it('間違った現在のパスワードでパスワード変更が失敗する', async () => {
      const registerResponse = await createTestUserWithData(mockUsers.valid);
      const token = registerResponse.body.token;

      const response = await authenticatedRequest(token)
        .put('/api/auth/password')
        .send({
          currentPassword: 'WrongPassword123',
          newPassword: 'NewPassword123',
        });

      expect(response.status).toBe(400);
      expectValidErrorResponse(response, 400);
    });
  });

  describe('PUT /api/auth/settings', () => {
    it('認証されたユーザーが設定を更新できる', async () => {
      const registerResponse = await createTestUserWithData(mockUsers.valid);
      const token = registerResponse.body.token;

      const response = await authenticatedRequest(token)
        .put('/api/auth/settings')
        .send({
          theme: 'DARK',
          language: 'EN',
        });

      expect(response.status).toBe(200);
      expectValidUserResponse(response);
      expect(response.body.theme).toBe('DARK');
      expect(response.body.language).toBe('EN');
    });
  });

  describe('DELETE /api/auth/account', () => {
    it('認証されたユーザーがアカウントを削除できる', async () => {
      const registerResponse = await createTestUserWithData(mockUsers.valid);
      const token = registerResponse.body.token;

      const response = await authenticatedRequest(token)
        .delete('/api/auth/account')
        .send({
          password: mockUsers.valid.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // 削除後にログインできないことを確認
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(mockUsers.valid);

      expect(loginResponse.status).toBe(401);
    });

    it('間違ったパスワードでアカウント削除が失敗する', async () => {
      const registerResponse = await createTestUserWithData(mockUsers.valid);
      const token = registerResponse.body.token;

      const response = await authenticatedRequest(token)
        .delete('/api/auth/account')
        .send({
          password: 'WrongPassword123',
        });

      expect(response.status).toBe(400);
      expectValidErrorResponse(response, 400);
    });
  });
});