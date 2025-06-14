import request from 'supertest'
import app from '../../index'
import { authService } from '../../test/authService'
import { testPrisma as prisma } from '../../test/prisma'

describe('Tag API', () => {
  let authToken: string
  let userId: string
  let tagId: string
  let feedId: string

  beforeAll(async () => {
    // テスト用ユーザーとトークンを作成
    const testAuth = await authService.createTestUser()
    authToken = testAuth.token
    userId = testAuth.user.id

    console.log('Test Auth:', { authToken: `${authToken.substring(0, 20)}...`, userId })

    // テスト用フィードを作成
    const feed = await prisma.feed.create({
      data: {
        title: 'Test Feed',
        url: 'https://example.com/feed.xml',
        userId,
      },
    })
    feedId = feed.id
  })

  afterAll(async () => {
    // テストデータをクリーンアップ
    await prisma.feedTag.deleteMany({})
    await prisma.tag.deleteMany({})
    await prisma.feed.deleteMany({})
    await prisma.user.deleteMany({})
  })

  describe('POST /api/tags', () => {
    it('should create a new tag', async () => {
      const tagData = {
        name: 'テクノロジー',
        color: '#3B82F6',
      }

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tagData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.tag.name).toBe(tagData.name)
      expect(response.body.data.tag.color).toBe(tagData.color)
      expect(response.body.data.tag.userId).toBe(userId)

      tagId = response.body.data.tag.id
    })

    it('should not allow duplicate tag names for the same user', async () => {
      const tagData = {
        name: 'テクノロジー', // 同じ名前
        color: '#EF4444',
      }

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tagData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('既に使用されています')
    })

    it('should validate tag name length', async () => {
      const tagData = {
        name: 'a'.repeat(21), // 21文字（制限は20文字）
        color: '#3B82F6',
      }

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tagData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should validate color format', async () => {
      const tagData = {
        name: 'テストタグ',
        color: 'invalid-color',
      }

      const response = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tagData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/tags', () => {
    it('should get all tags for the user', async () => {
      const response = await request(app)
        .get('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.tags).toHaveLength(1)
      expect(response.body.data.tags[0].name).toBe('テクノロジー')
      expect(response.body.data.tags[0].feedCount).toBe(0)
    })

    it('should search tags by name', async () => {
      // 追加のタグを作成
      await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'ニュース', color: '#EF4444' })

      const response = await request(app)
        .get('/api/tags?search=テク')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.tags).toHaveLength(1)
      expect(response.body.data.tags[0].name).toBe('テクノロジー')
    })
  })

  describe('GET /api/tags/:tagId', () => {
    it('should get tag by ID', async () => {
      const response = await request(app)
        .get(`/api/tags/${tagId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.tag.id).toBe(tagId)
      expect(response.body.data.tag.name).toBe('テクノロジー')
    })

    it('should return 404 for non-existent tag', async () => {
      const response = await request(app)
        .get('/api/tags/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/tags/:tagId', () => {
    it('should update tag', async () => {
      const updateData = {
        name: 'テクノロジー更新',
        color: '#10B981',
      }

      const response = await request(app)
        .put(`/api/tags/${tagId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.tag.name).toBe(updateData.name)
      expect(response.body.data.tag.color).toBe(updateData.color)
    })
  })

  describe('POST /api/feeds/:feedId/tags', () => {
    it('should assign existing tag to feed', async () => {
      const response = await request(app)
        .post(`/api/feeds/${feedId}/tags`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tagId })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.feedTag.feedId).toBe(feedId)
      expect(response.body.data.feedTag.tagId).toBe(tagId)
    })

    it('should create new tag and assign to feed', async () => {
      const response = await request(app)
        .post(`/api/feeds/${feedId}/tags`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tagName: '新しいタグ', color: '#F59E0B' })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.feedTag.tag.name).toBe('新しいタグ')
    })

    it('should not allow duplicate tag assignment', async () => {
      const response = await request(app)
        .post(`/api/feeds/${feedId}/tags`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tagId })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('既に割り当てられています')
    })
  })

  describe('GET /api/feeds with tag filtering', () => {
    it('should filter feeds by tag', async () => {
      const response = await request(app)
        .get(`/api/feeds?tagId=${tagId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.feeds).toHaveLength(1)
      expect(response.body.data.feeds[0].id).toBe(feedId)
      expect(response.body.data.feeds[0].tags).toHaveLength(2) // 2つのタグが割り当てられている
    })
  })

  describe('GET /api/tags/:tagId/feeds', () => {
    it('should get feeds by tag', async () => {
      const response = await request(app)
        .get(`/api/tags/${tagId}/feeds`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.feeds).toHaveLength(1)
      expect(response.body.data.feeds[0].id).toBe(feedId)
      expect(response.body.data.tag.id).toBe(tagId)
    })
  })

  describe('DELETE /api/feeds/:feedId/tags/:tagId', () => {
    it('should remove tag from feed', async () => {
      const response = await request(app)
        .delete(`/api/feeds/${feedId}/tags/${tagId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('削除しました')
    })

    it('should return error when removing non-assigned tag', async () => {
      const response = await request(app)
        .delete(`/api/feeds/${feedId}/tags/${tagId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('割り当てられていません')
    })
  })

  describe('DELETE /api/tags/:tagId', () => {
    it('should delete tag', async () => {
      const response = await request(app)
        .delete(`/api/tags/${tagId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('削除しました')
    })

    it('should return error when deleting non-existent tag', async () => {
      const response = await request(app)
        .delete(`/api/tags/${tagId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('Authentication', () => {
    it('should require authentication for all tag endpoints', async () => {
      await request(app).get('/api/tags').expect(401)

      await request(app).post('/api/tags').send({ name: 'テストタグ' }).expect(401)

      await request(app)
        .post(`/api/feeds/${feedId}/tags`)
        .send({ tagName: 'テストタグ' })
        .expect(401)
    })
  })
})
