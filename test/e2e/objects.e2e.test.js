"use strict";
// test/e2e/objects.e2e.test.ts
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
describe('Objects API E2E Tests', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield database_1.default.connect();
        yield database_1.default.initializeTables();
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean objects table before each test
        yield database_1.default.query('TRUNCATE TABLE objects RESTART IDENTITY CASCADE');
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield database_1.default.query('TRUNCATE TABLE objects RESTART IDENTITY CASCADE');
        yield database_1.default.close();
    }));
    describe('POST /api/objects', () => {
        it('should create new object', () => __awaiter(void 0, void 0, void 0, function* () {
            const objectData = {
                title: 'E2E Test Object',
                description: 'This is a test object',
                type: 'task',
                metadata: { priority: 'high' },
                items: []
            };
            const response = yield (0, supertest_1.default)(app)
                .post('/api/objects')
                .send(objectData)
                .expect('Content-Type', /json/)
                .expect(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.title).toBe(objectData.title);
            expect(response.body.type).toBe('task');
            expect(response.body.upvotes).toBe(0);
            expect(response.body.downvotes).toBe(0);
        }));
        it('should return 400 when title is missing', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/objects')
                .send({ description: 'No title' })
                .expect(400);
            expect(response.body.error).toBe('Title and description are required');
        }));
        it('should return 400 when description is missing', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/objects')
                .send({ title: 'No description' })
                .expect(400);
        }));
        it('should create object with items', () => __awaiter(void 0, void 0, void 0, function* () {
            const objectData = {
                title: 'Object with Items',
                description: 'Has items',
                items: [
                    {
                        type: 'task',
                        title: 'Item 1',
                        description: 'First item',
                        status: 'pending',
                        completed: false,
                        metadata: {}
                    }
                ]
            };
            const response = yield (0, supertest_1.default)(app)
                .post('/api/objects')
                .send(objectData)
                .expect(201);
            expect(response.body.items).toHaveLength(1);
            expect(response.body.items[0].title).toBe('Item 1');
        }));
        it('should default type to "object"', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/objects')
                .send({ title: 'Test', description: 'Test desc' })
                .expect(201);
            expect(response.body.type).toBe('object');
        }));
    });
    describe('GET /api/objects', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Seed test data
            yield (0, supertest_1.default)(app).post('/api/objects').send({
                title: 'Object 1',
                description: 'Desc 1',
                type: 'task'
            });
            yield (0, supertest_1.default)(app).post('/api/objects').send({
                title: 'Object 2',
                description: 'Desc 2',
                type: 'event'
            });
            yield (0, supertest_1.default)(app).post('/api/objects').send({
                title: 'Object 3',
                description: 'Desc 3',
                type: 'task'
            });
        }));
        it('should return all objects with pagination', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/objects')
                .expect(200);
            expect(response.body.objects).toHaveLength(3);
            expect(response.body.pagination).toHaveProperty('total', 3);
            expect(response.body.pagination).toHaveProperty('hasMore', false);
        }));
        it('should filter by type', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/objects?type=task')
                .expect(200);
            expect(response.body.objects).toHaveLength(2);
            expect(response.body.objects.every((o) => o.type === 'task')).toBe(true);
        }));
        it('should paginate results', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/objects?limit=2&offset=0')
                .expect(200);
            expect(response.body.objects).toHaveLength(2);
            expect(response.body.pagination.hasMore).toBe(true);
        }));
        it('should handle offset', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/objects?limit=10&offset=2')
                .expect(200);
            expect(response.body.objects).toHaveLength(1);
        }));
    });
    describe('GET /api/objects/:id', () => {
        let createdObject;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/objects')
                .send({
                title: 'Test Object',
                description: 'Test Description'
            });
            createdObject = response.body;
        }));
        it('should return object by id', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get(`/api/objects/${createdObject.id}`)
                .expect(200);
            expect(response.body.id).toBe(createdObject.id);
            expect(response.body.title).toBe('Test Object');
        }));
        it('should return 404 for non-existent id', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get('/api/objects/99999')
                .expect(404);
            expect(response.body.error).toBe('Object not found');
        }));
    });
    describe('PUT /api/objects/:id', () => {
        let createdObject;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/objects')
                .send({
                title: 'Original Title',
                description: 'Original Description'
            });
            createdObject = response.body;
        }));
        it('should update object', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .put(`/api/objects/${createdObject.id}`)
                .send({ title: 'Updated Title' })
                .expect(200);
            expect(response.body.title).toBe('Updated Title');
            expect(response.body.description).toBe('Original Description');
        }));
        it('should update metadata', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .put(`/api/objects/${createdObject.id}`)
                .send({ metadata: { newKey: 'newValue' } })
                .expect(200);
            expect(response.body.metadata).toHaveProperty('newKey', 'newValue');
        }));
        it('should return 404 for non-existent id', () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app)
                .put('/api/objects/99999')
                .send({ title: 'Updated' })
                .expect(404);
        }));
    });
    describe('DELETE /api/objects/:id', () => {
        let createdObject;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/objects')
                .send({
                title: 'To Delete',
                description: 'Will be deleted'
            });
            createdObject = response.body;
        }));
        it('should delete object', () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app)
                .delete(`/api/objects/${createdObject.id}`)
                .expect(200);
            // Verify deletion
            yield (0, supertest_1.default)(app)
                .get(`/api/objects/${createdObject.id}`)
                .expect(404);
        }));
        it('should return 404 for non-existent id', () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app)
                .delete('/api/objects/99999')
                .expect(404);
        }));
    });
    describe('PATCH /api/objects/:id/vote', () => {
        let createdObject;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/objects')
                .send({
                title: 'Voteable Object',
                description: 'Can be voted'
            });
            createdObject = response.body;
        }));
        it('should upvote object', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .patch(`/api/objects/${createdObject.id}/vote`)
                .send({ type: 'upvote' })
                .expect(200);
            expect(response.body.upvotes).toBe(1);
            expect(response.body.downvotes).toBe(0);
        }));
        it('should downvote object', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .patch(`/api/objects/${createdObject.id}/vote`)
                .send({ type: 'downvote' })
                .expect(200);
            expect(response.body.downvotes).toBe(1);
        }));
        it('should accumulate votes', () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app)
                .patch(`/api/objects/${createdObject.id}/vote`)
                .send({ type: 'upvote' });
            yield (0, supertest_1.default)(app)
                .patch(`/api/objects/${createdObject.id}/vote`)
                .send({ type: 'upvote' });
            const response = yield (0, supertest_1.default)(app)
                .patch(`/api/objects/${createdObject.id}/vote`)
                .send({ type: 'upvote' })
                .expect(200);
            expect(response.body.upvotes).toBe(3);
        }));
        it('should return 400 for invalid vote type', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .patch(`/api/objects/${createdObject.id}/vote`)
                .send({ type: 'invalid' })
                .expect(400);
            expect(response.body.error).toContain('upvote');
        }));
    });
    describe('PATCH /api/objects/:id/items/:itemIndex', () => {
        let createdObject;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/objects')
                .send({
                title: 'Object with Items',
                description: 'Has items',
                items: [
                    {
                        type: 'task',
                        title: 'Item 1',
                        description: 'First',
                        status: 'pending',
                        completed: false,
                        metadata: {}
                    },
                    {
                        type: 'task',
                        title: 'Item 2',
                        description: 'Second',
                        status: 'pending',
                        completed: false,
                        metadata: {}
                    }
                ]
            });
            createdObject = response.body;
        }));
        it('should update specific item', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .patch(`/api/objects/${createdObject.id}/items/0`)
                .send({ status: 'completed', completed: true })
                .expect(200);
            expect(response.body.item.status).toBe('completed');
            expect(response.body.item.completed).toBe(true);
        }));
        it('should return 400 for invalid item index', () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app)
                .patch(`/api/objects/${createdObject.id}/items/99`)
                .send({ status: 'completed' })
                .expect(400);
        }));
        it('should return 404 for non-existent object', () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app)
                .patch('/api/objects/99999/items/0')
                .send({ status: 'completed' })
                .expect(404);
        }));
    });
    describe('Security Tests', () => {
        it('should handle SQL injection attempts', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/objects')
                .send({
                title: "'; DROP TABLE objects; --",
                description: 'SQL injection attempt'
            })
                .expect(201);
            // Should be stored as-is (parameterized queries prevent injection)
            expect(response.body.title).toBe("'; DROP TABLE objects; --");
            // Verify table still exists
            const listResponse = yield (0, supertest_1.default)(app)
                .get('/api/objects')
                .expect(200);
            expect(listResponse.body.objects).toHaveLength(1);
        }));
        it('should handle XSS attempts in metadata', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post('/api/objects')
                .send({
                title: 'XSS Test',
                description: 'Test',
                metadata: {
                    script: '<script>alert("XSS")</script>'
                }
            })
                .expect(201);
            // Data is stored - XSS prevention is client-side responsibility
            expect(response.body.metadata.script).toBe('<script>alert("XSS")</script>');
        }));
        it('should handle deeply nested objects', () => __awaiter(void 0, void 0, void 0, function* () {
            const deepObject = {
                title: 'Deep Object',
                description: 'Has deep nesting',
                metadata: {
                    level1: {
                        level2: {
                            level3: {
                                level4: {
                                    value: 'deep'
                                }
                            }
                        }
                    }
                }
            };
            const response = yield (0, supertest_1.default)(app)
                .post('/api/objects')
                .send(deepObject)
                .expect(201);
            expect(response.body.metadata.level1.level2.level3.level4.value).toBe('deep');
        }));
    });
});
