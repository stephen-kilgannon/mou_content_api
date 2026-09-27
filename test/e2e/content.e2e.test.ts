// test/e2e/content.e2e.test.ts

import request from 'supertest';
import createTestApp from './app';
import database from '../../src/utils/database';

const app = createTestApp();

describe('Content API E2E Tests', () => {
  beforeAll(async () => {
    await database.connect();
    await database.initializeTables();
  });

  beforeEach(async () => {
    // Clean content table before each test
    await database.query('TRUNCATE TABLE content RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await database.query('TRUNCATE TABLE content RESTART IDENTITY CASCADE');
    await database.close();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'content-api');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/content', () => {
    it('should create new content', async () => {
      const contentData = {
        title: 'E2E Test Content',
        content: 'This is test content body',
        meta: {
          description: 'Test description',
          keywords: ['e2e', 'test']
        }
      };

      const response = await request(app)
        .post('/api/content')
        .send(contentData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(contentData.title);
      expect(response.body.content).toBe(contentData.content);
      expect(response.body.slug).toBe('e2e-test-content');
      expect(response.body).toHaveProperty('created_at');
    });

    it('should auto-generate slug from title', async () => {
      const response = await request(app)
        .post('/api/content')
        .send({
          title: 'My Amazing Blog Post',
          content: 'Content here',
          meta: { description: 'test' }
        })
        .expect(201);

      expect(response.body.slug).toBe('my-amazing-blog-post');
    });

    it('should use custom slug if provided', async () => {
      const response = await request(app)
        .post('/api/content')
        .send({
          title: 'My Post',
          content: 'Content here',
          meta: { description: 'test' },
          slug: 'custom-slug'
        })
        .expect(201);

      expect(response.body.slug).toBe('custom-slug');
    });
  });

  describe('GET /api/content', () => {
    beforeEach(async () => {
      // Seed test data
      await request(app).post('/api/content').send({
        title: 'Content 1',
        content: 'Body 1',
        meta: { description: 'desc1' }
      });
      await request(app).post('/api/content').send({
        title: 'Content 2',
        content: 'Body 2',
        meta: { description: 'desc2' }
      });
    });

    it('should return all content', async () => {
      const response = await request(app)
        .get('/api/content')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should return content in descending order by created_at', async () => {
      const response = await request(app)
        .get('/api/content')
        .expect(200);

      expect(response.body[0].title).toBe('Content 2');
      expect(response.body[1].title).toBe('Content 1');
    });
  });

  describe('GET /api/content/:id', () => {
    let createdContent: any;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/content')
        .send({
          title: 'Test Content',
          content: 'Test Body',
          meta: { description: 'test' }
        });
      createdContent = response.body;
    });

    it('should return content by id', async () => {
      const response = await request(app)
        .get(`/api/content/${createdContent.id}`)
        .expect(200);

      expect(response.body.id).toBe(createdContent.id);
      expect(response.body.title).toBe('Test Content');
    });

    it('should return 404 for non-existent id', async () => {
      const response = await request(app)
        .get('/api/content/99999')
        .expect(404);

      expect(response.body.error).toBe('Content not found');
    });
  });

  describe('GET /api/content/slug/:slug', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/content')
        .send({
          title: 'Slug Test',
          content: 'Test Body',
          meta: { description: 'test' },
          slug: 'my-unique-slug'
        });
    });

    it('should return content by slug', async () => {
      const response = await request(app)
        .get('/api/content/slug/my-unique-slug')
        .expect(200);

      expect(response.body.slug).toBe('my-unique-slug');
      expect(response.body.title).toBe('Slug Test');
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/content/slug/nonexistent-slug')
        .expect(404);

      expect(response.body.error).toBe('Content not found');
    });
  });

  describe('DELETE /api/content/:id', () => {
    let createdContent: any;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/content')
        .send({
          title: 'To Delete',
          content: 'Body',
          meta: { description: 'test' }
        });
      createdContent = response.body;
    });

    it('should delete content by id', async () => {
      await request(app)
        .delete(`/api/content/${createdContent.id}`)
        .expect(204);

      // Verify deletion
      await request(app)
        .get(`/api/content/${createdContent.id}`)
        .expect(404);
    });

    it('should return 404 for non-existent id', async () => {
      await request(app)
        .delete('/api/content/99999')
        .expect(404);
    });
  });

  describe('Security Tests', () => {
    it('should handle large payloads gracefully', async () => {
      const largeContent = {
        title: 'Large Content',
        content: 'x'.repeat(10000), // 10KB content
        meta: { description: 'test' }
      };

      const response = await request(app)
        .post('/api/content')
        .send(largeContent)
        .expect(201);

      expect(response.body.content.length).toBe(10000);
    });

    it('should handle special characters in title', async () => {
      const response = await request(app)
        .post('/api/content')
        .send({
          title: '<script>alert("XSS")</script>',
          content: 'Test',
          meta: { description: 'test' }
        })
        .expect(201);

      // Slug should be sanitized
      expect(response.body.slug).not.toContain('<script>');
    });

    it('should handle unicode characters', async () => {
      const response = await request(app)
        .post('/api/content')
        .send({
          title: '日本語タイトル',
          content: 'Japanese content 日本語',
          meta: { description: 'テスト' }
        })
        .expect(201);

      expect(response.body.title).toBe('日本語タイトル');
    });

    it('should reject invalid JSON', async () => {
      const response = await request(app)
        .post('/api/content')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });
  });
});
