import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import app from '../../index'
import { prisma } from '../../lib/prisma'
import {
  authenticatedRequest,
  createTestUser,
  createTestUserWithData,
  loginTestUser,
} from '../../test/helpers'

describe('フィードAPI', () => {
  let authToken: string
  let userId: string

  beforeEach(async () => {
    // テストユーザーを作成してログイン
    const user = await createTestUser()
    const loginResult = await loginTestUser()
    authToken = loginResult.body.token
    userId = user.id
  })

  afterEach(async () => {
    // テストデータのクリーンアップ
    await prisma.article.deleteMany()
    await prisma.feed.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('POST /api/feeds', () => {
    it('Gizmodo JapanのRSSフィードを正常に追加できる', async () => {
      const feedUrl = 'https://www.gizmodo.jp/index.xml'

      const response = await authenticatedRequest(authToken)
        .post('/api/feeds')
        .send({ url: feedUrl })

      console.log('Feed creation response:', response.body)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('message', 'フィードが作成されました')
      expect(response.body).toHaveProperty('feed')
      expect(response.body.feed.url).toBe(feedUrl)
      expect(response.body.feed.title).toBeDefined()
      expect(response.body.feed.userId).toBe(userId)
    }, 10000)

    it('無効なURLでフィード作成が失敗する', async () => {
      const response = await authenticatedRequest(authToken)
        .post('/api/feeds')
        .send({ url: 'invalid-url' })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('既に登録済みのフィードで重複エラーが発生する', async () => {
      const feedUrl = 'https://www.gizmodo.jp/index.xml'

      // 最初の追加
      await authenticatedRequest(authToken).post('/api/feeds').send({ url: feedUrl })

      // 重複追加の試行
      const response = await authenticatedRequest(authToken)
        .post('/api/feeds')
        .send({ url: feedUrl })

      expect(response.status).toBe(409)
      expect(response.body).toHaveProperty('error', 'このフィードは既に登録されています')
    })
  })

  describe('POST /api/feeds/:feedId/refresh', () => {
    let feedId: string

    beforeEach(async () => {
      // テスト用フィードを事前に作成
      const feedResponse = await authenticatedRequest(authToken)
        .post('/api/feeds')
        .send({ url: 'https://www.gizmodo.jp/index.xml' })

      feedId = feedResponse.body.feed.id
    })

    it('Gizmodo Japanフィードを正常に更新できる', async () => {
      const response = await authenticatedRequest(authToken).post(`/api/feeds/${feedId}/refresh`)

      console.log('Feed refresh response:', response.body)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('message', 'フィードを更新しました')
      expect(response.body).toHaveProperty('feed')
      expect(response.body.feed.id).toBe(feedId)
      expect(response.body.feed.lastFetchedAt).toBeDefined()
    })

    it('存在しないフィードIDで更新が失敗する', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      const response = await authenticatedRequest(authToken).post(
        `/api/feeds/${nonExistentId}/refresh`
      )

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error', 'フィードが見つかりません')
    })

    it('他のユーザーのフィードは更新できない', async () => {
      // 別のユーザーを作成
      const otherUser = await createTestUser('other@example.com', 'TestPass123')
      const otherLoginResult = await loginTestUser('other@example.com', 'TestPass123')

      const response = await authenticatedRequest(otherLoginResult.body.token).post(
        `/api/feeds/${feedId}/refresh`
      )

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error', 'フィードが見つかりません')
    })
  })

  describe('POST /api/feeds/refresh-all', () => {
    beforeEach(async () => {
      // 複数のテスト用フィードを作成
      await authenticatedRequest(authToken)
        .post('/api/feeds')
        .send({ url: 'https://www.gizmodo.jp/index.xml' })
    })

    it('全フィードを正常に更新できる', async () => {
      const response = await authenticatedRequest(authToken).post('/api/feeds/refresh-all')

      console.log('Refresh all feeds response:', response.body)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('message', 'フィードの更新を完了しました')
    })
  })

  describe('GET /api/feeds/:feedId/articles', () => {
    let feedId: string

    beforeEach(async () => {
      // テスト用フィードを作成して記事を取得
      const feedResponse = await authenticatedRequest(authToken)
        .post('/api/feeds')
        .send({ url: 'https://www.gizmodo.jp/index.xml' })

      feedId = feedResponse.body.feed.id

      // フィードを更新して記事を取得
      await authenticatedRequest(authToken).post(`/api/feeds/${feedId}/refresh`)
    })

    it('フィードの記事一覧を取得できる', async () => {
      const response = await authenticatedRequest(authToken).get(`/api/feeds/${feedId}/articles`)

      console.log('Feed articles response:', response.body)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('articles')
      expect(response.body.data).toHaveProperty('pagination')
      expect(Array.isArray(response.body.data.articles)).toBe(true)
    })

    it('ページネーションが正常に動作する', async () => {
      const response = await authenticatedRequest(authToken).get(
        `/api/feeds/${feedId}/articles?page=1&limit=5`
      )

      expect(response.status).toBe(200)
      expect(response.body.data.pagination.page).toBe(1)
      expect(response.body.data.pagination.limit).toBe(5)
      expect(response.body.data.articles.length).toBeLessThanOrEqual(5)
    })
  })

  describe('エラーハンドリングテスト', () => {
    it('無効なRSSフィードURLでエラーが正しく処理される', async () => {
      const invalidUrls = [
        'https://example.com/not-rss',
        'https://nonexistent-domain-12345.com/feed.xml',
        'http://httpstat.us/500', // 500エラーを返すURL
      ]

      for (const url of invalidUrls) {
        const response = await authenticatedRequest(authToken).post('/api/feeds').send({ url })

        console.log(`Testing invalid URL ${url}, response:`, response.body)

        expect(response.status).toBeGreaterThanOrEqual(400)
        expect(response.body).toHaveProperty('error')
      }
    }, 30000) // タイムアウトを30秒に設定
  })
})
