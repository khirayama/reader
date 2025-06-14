import type { User } from '@prisma/client'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import app from '../../index'
import { prisma } from '../../lib/prisma'
import { cleanupTestData, createTestUser, getAuthToken } from '../../test/helpers'

describe('OPML API', () => {
  let user: User
  let authToken: string

  beforeEach(async () => {
    user = await createTestUser()
    authToken = await getAuthToken(user.id)
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('GET /api/opml/export', () => {
    it('should export feeds as OPML', async () => {
      // テスト用フィードを作成
      await prisma.feed.createMany({
        data: [
          {
            userId: user.id,
            url: 'https://example.com/feed1.xml',
            title: 'Test Feed 1',
            description: 'Test Description 1',
            siteUrl: 'https://example.com',
          },
          {
            userId: user.id,
            url: 'https://example.com/feed2.xml',
            title: 'Test Feed 2',
            description: 'Test Description 2',
            siteUrl: 'https://example2.com',
          },
        ],
      })

      const response = await request(app)
        .get('/api/opml/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect('Content-Type', /application\/xml/)

      expect(response.text).toContain('<?xml version="1.0" encoding="UTF-8"')
      expect(response.text).toContain('<opml version="2.0">')
      expect(response.text).toContain('Test Feed 1')
      expect(response.text).toContain('Test Feed 2')
      expect(response.text).toContain('https://example.com/feed1.xml')
      expect(response.text).toContain('https://example.com/feed2.xml')
    })

    it('should return empty OPML when no feeds', async () => {
      const response = await request(app)
        .get('/api/opml/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.text).toContain('<?xml version="1.0" encoding="UTF-8"')
      expect(response.text).toContain('<opml version="2.0">')
      expect(response.text).toContain('<body/>')
    })

    it('should require authentication', async () => {
      await request(app).get('/api/opml/export').expect(401)
    })
  })

  describe('POST /api/opml/import', () => {
    const validOpml = `<?xml version="1.0" encoding="UTF-8"?>
      <opml version="2.0">
        <head>
          <title>Test OPML</title>
        </head>
        <body>
          <outline text="Tech News" title="Tech News">
            <outline type="rss" text="TechCrunch" title="TechCrunch" xmlUrl="https://techcrunch.com/feed/" htmlUrl="https://techcrunch.com/"/>
            <outline type="rss" text="The Verge" title="The Verge" xmlUrl="https://www.theverge.com/rss/index.xml" htmlUrl="https://www.theverge.com/"/>
          </outline>
        </body>
      </opml>`

    it('should import feeds from OPML file', async () => {
      const response = await request(app)
        .post('/api/opml/import')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(validOpml), {
          filename: 'feeds.opml',
          contentType: 'text/xml',
        })
        .expect(200)

      expect(response.body).toMatchObject({
        message: 'OPML import completed',
        imported: expect.any(Number),
        failed: expect.any(Number),
        errors: expect.any(Array),
      })
    })

    it('should handle invalid OPML format', async () => {
      const invalidOpml = `<?xml version="1.0" encoding="UTF-8"?>
        <invalid>Not an OPML file</invalid>`

      await request(app)
        .post('/api/opml/import')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(invalidOpml), {
          filename: 'invalid.opml',
          contentType: 'text/xml',
        })
        .expect(400)
    })

    it('should require a file', async () => {
      await request(app)
        .post('/api/opml/import')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
    })

    it('should require authentication', async () => {
      await request(app)
        .post('/api/opml/import')
        .attach('file', Buffer.from(validOpml), {
          filename: 'feeds.opml',
          contentType: 'text/xml',
        })
        .expect(401)
    })
  })
})
