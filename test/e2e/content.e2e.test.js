"use strict";
// test/e2e/content.e2e.test.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("../../src/utils/database"));
const app = (0, app_1.default)();
describe('Content API E2E Tests', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield database_1.default.connect();
        yield database_1.default.initializeTables();
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean content table before each test
        yield database_1.default.query('TRUNCATE TABLE content RESTART IDENTITY CASCADE');
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield database_1.default.query('TRUNCATE TABLE content RESTART IDENTITY CASCADE');
        yield database_1.default.close();
    }));
    describe('GET /health', () => {
        it('should return health status', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('service', 'content-api');
            expect(response.body).toHaveProperty('timestamp');
        }));
    });
    describe('POST /api/content', () => {
        it('should create new content', () => __awaiter(void 0, void 0, void 0, function* () {
            const contentData = {
                title: 'E2E Test Content',
                content: 'This is test content body',
                meta: {
                    description: 'Test description',
                    keywords: ['e2e', 'test']
                }
            };
            const response = yield (0, supertest_1.default)(app)
                .post('/api/content')
                .send(contentData)
                .expect('Content-Type', /json/)
                .expect(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.title).toBe(contentData.title);
            expect(response.body.content).toBe(contentData.content);
            expect(response.body.slug).toBe('e2e-test-content');
            expect(response.body).toHaveProperty('created_at');
        }));
        it('should auto-generate slug from title', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/content')
                .send({
                title: 'My Amazing Blog Post',
                content: 'Content here',
                meta: { description: 'test' }
            })
                .expect(201);
            expect(response.body.slug).toBe('my-amazing-blog-post');
        }));
        it('should use custom slug if provided', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/content')
                .send({
                title: 'My Post',
                content: 'Content here',
                meta: { description: 'test' },
                slug: 'custom-slug'
            })
                .expect(201);
            expect(response.body.slug).toBe('custom-slug');
        }));
    });
    describe('GET /api/content', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Seed test data
            yield (0, supertest_1.default)(app).post('/api/content').send({
                title: 'Content 1',
                content: 'Body 1',
                meta: { description: 'desc1' }
            });
            yield (0, supertest_1.default)(app).post('/api/content').send({
                title: 'Content 2',
                content: 'Body 2',
                meta: { description: 'desc2' }
            });
        }));
        it('should return all content', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/content')
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
        }));
        it('should return content in descending order by created_at', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/content')
                .expect(200);
            expect(response.body[0].title).toBe('Content 2');
            expect(response.body[1].title).toBe('Content 1');
        }));
    });
    describe('GET /api/content/:id', () => {
        let createdContent;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/content')
                .send({
                title: 'Test Content',
                content: 'Test Body',
                meta: { description: 'test' }
            });
            createdContent = response.body;
        }));
        it('should return content by id', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get(`/api/content/${createdContent.id}`)
                .expect(200);
            expect(response.body.id).toBe(createdContent.id);
            expect(response.body.title).toBe('Test Content');
        }));
        it('should return 404 for non-existent id', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/content/99999')
                .expect(404);
            expect(response.body.error).toBe('Content not found');
        }));
    });
    describe('GET /api/content/slug/:slug', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app)
                .post('/api/content')
                .send({
                title: 'Slug Test',
                content: 'Test Body',
                meta: { description: 'test' },
                slug: 'my-unique-slug'
            });
        }));
        it('should return content by slug', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/content/slug/my-unique-slug')
                .expect(200);
            expect(response.body.slug).toBe('my-unique-slug');
            expect(response.body.title).toBe('Slug Test');
        }));
        it('should return 404 for non-existent slug', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/content/slug/nonexistent-slug')
                .expect(404);
            expect(response.body.error).toBe('Content not found');
        }));
    });
    describe('DELETE /api/content/:id', () => {
        let createdContent;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/content')
                .send({
                title: 'To Delete',
                content: 'Body',
                meta: { description: 'test' }
            });
            createdContent = response.body;
        }));
        it('should delete content by id', () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app)
                .delete(`/api/content/${createdContent.id}`)
                .expect(204);
            // Verify deletion
            yield (0, supertest_1.default)(app)
                .get(`/api/content/${createdContent.id}`)
                .expect(404);
        }));
        it('should return 404 for non-existent id', () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app)
                .delete('/api/content/99999')
                .expect(404);
        }));
    });
    describe('Security Tests', () => {
        it('should handle large payloads gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            const largeContent = {
                title: 'Large Content',
                content: 'x'.repeat(10000), // 10KB content
                meta: { description: 'test' }
            };
            const response = yield (0, supertest_1.default)(app)
                .post('/api/content')
                .send(largeContent)
                .expect(201);
            expect(response.body.content.length).toBe(10000);
        }));
        it('should handle special characters in title', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/content')
                .send({
                title: '<script>alert("XSS")</script>',
                content: 'Test',
                meta: { description: 'test' }
            })
                .expect(201);
            // Slug should be sanitized
            expect(response.body.slug).not.toContain('<script>');
        }));
        it('should handle unicode characters', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/content')
                .send({
                title: '日本語タイトル',
                content: 'Japanese content 日本語',
                meta: { description: 'テスト' }
            })
                .expect(201);
            expect(response.body.title).toBe('日本語タイトル');
        }));
        it('should reject invalid JSON', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/content')
                .set('Content-Type', 'application/json')
                .send('{ invalid json }')
                .expect(400);
        }));
    });
});
