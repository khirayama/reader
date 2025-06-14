import request from 'supertest'
import { expect } from 'vitest'
import app from '../index'
import { prisma } from '../lib/prisma'
import { TestAuthService } from './authService'

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
}

// ユーザー作成ヘルパー（既存の型での互換性を保つため）
export const createTestUser = async (email = 'test@example.com', password = 'TestPass123') => {
  const response = await request(app).post('/api/auth/register').send({
    email,
    password,
    name: 'Test User',
  })

  return response.body.user
}

// 新しいユーザー作成ヘルパー（オブジェクト形式）
export const createTestUserWithData = async (userData?: {
  email?: string
  password?: string
  name?: string
}) => {
  const defaultData = {
    email: 'test@example.com',
    password: 'TestPass123',
    name: 'Test User',
  }

  const data = userData ? { ...defaultData, ...userData } : defaultData

  const response = await request(app).post('/api/auth/register').send(data)

  return response
}

// ログインヘルパー（既存の型での互換性を保つため）
export const loginTestUser = async (email = 'test@example.com', password = 'TestPass123') => {
  const response = await request(app).post('/api/auth/login').send({ email, password })

  return response
}

// 新しいログインヘルパー（オブジェクト形式）
export const loginTestUserWithData = async (userData?: { email?: string; password?: string }) => {
  const defaultData = {
    email: 'test@example.com',
    password: 'TestPass123',
  }

  const data = userData ? { ...defaultData, ...userData } : defaultData

  const response = await request(app).post('/api/auth/login').send(data)

  return response
}

// 認証付きリクエストヘルパー
export const authenticatedRequest = (token: string) => {
  return {
    get: (url: string) => request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => request(app).post(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) => request(app).put(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => request(app).delete(url).set('Authorization', `Bearer ${token}`),
  }
}

// パスワードリセットトークン生成ヘルパー
export const createPasswordResetToken = async (email: string) => {
  // APIエンドポイントを使用してパスワードリセットを要求
  await request(app).post('/api/auth/forgot-password').send({ email })

  // テスト環境でのみ：データベースから最新のトークンを取得
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null

  const token = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, used: false },
    orderBy: { createdAt: 'desc' },
  })

  return token?.token
}

// レスポンス検証ヘルパー（テスト環境でのみ使用）
export const expectValidAuthResponse = (response: any) => {
  expect(response.body).toHaveProperty('user')
  expect(response.body).toHaveProperty('token')
  expect(response.body.user).toHaveProperty('id')
  expect(response.body.user).toHaveProperty('email')
  expect(response.body.user).not.toHaveProperty('password')
  expect(typeof response.body.token).toBe('string')
}

export const expectValidUserResponse = (response: any) => {
  expect(response.body).toHaveProperty('id')
  expect(response.body).toHaveProperty('email')
  expect(response.body).not.toHaveProperty('password')
}

export const expectValidErrorResponse = (response: any, status: number) => {
  expect(response.status).toBe(status)
  expect(response.body).toHaveProperty('error')
  expect(typeof response.body.error).toBe('string')
}

// 認証トークン取得ヘルパー
export const getAuthToken = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  return TestAuthService.generateToken(user)
}

// テストデータクリーンアップヘルパー
export const cleanupTestData = async () => {
  // テスト環境でのみ実行
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('cleanupTestData can only be used in test environment')
  }

  // データベースのクリーンアップ（依存関係の順序を考慮）
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany(),
    prisma.articleReadStatus.deleteMany(),
    prisma.articleBookmark.deleteMany(),
    prisma.article.deleteMany(),
    prisma.feed.deleteMany(),
    prisma.user.deleteMany(),
  ])
}
