"use strict";
// test/unit/models/content.model.test.ts
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
const content_factory_1 = require("../../factories/content.factory");
const database_mock_1 = require("../../mocks/database.mock");
// Mock the database module before importing the model
jest.mock('../../../src/utils/database', () => ({
    query: jest.fn(),
    connect: jest.fn(),
    close: jest.fn(),
    initializeTables: jest.fn()
}));
jest.mock('../../../src/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
}));
const content_model_1 = __importDefault(require("../../../src/models/content.model"));
const database_1 = __importDefault(require("../../../src/utils/database"));
describe('ContentModel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (0, content_factory_1.resetContentIdCounter)();
    });
    describe('create', () => {
        it('should create new content with auto-generated slug', () => __awaiter(void 0, void 0, void 0, function* () {
            const input = (0, content_factory_1.createMockContentInput)({ title: 'My Test Title' });
            const expectedContent = (0, content_factory_1.createMockContent)(Object.assign(Object.assign({}, input), { slug: 'my-test-title' }));
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([expectedContent]));
            const result = yield content_model_1.default.create(input);
            expect(database_1.default.query).toHaveBeenCalledTimes(1);
            expect(database_1.default.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO content'), expect.arrayContaining([input.title, input.content, expect.any(String), 'my-test-title']));
            expect(result.title).toBe(input.title);
        }));
        it('should use provided slug if given', () => __awaiter(void 0, void 0, void 0, function* () {
            const input = (0, content_factory_1.createMockContentInput)({ slug: 'custom-slug' });
            const expectedContent = (0, content_factory_1.createMockContent)(Object.assign({}, input));
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([expectedContent]));
            yield content_model_1.default.create(input);
            expect(database_1.default.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO content'), expect.arrayContaining(['custom-slug']));
        }));
        it('should throw error on database failure', () => __awaiter(void 0, void 0, void 0, function* () {
            const input = (0, content_factory_1.createMockContentInput)();
            database_1.default.query.mockRejectedValueOnce(new Error('Database error'));
            yield expect(content_model_1.default.create(input)).rejects.toThrow('Database error');
        }));
    });
    describe('findAll', () => {
        it('should return all content items', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockContents = [
                (0, content_factory_1.createMockContent)(),
                (0, content_factory_1.createMockContent)(),
                (0, content_factory_1.createMockContent)()
            ];
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)(mockContents));
            const result = yield content_model_1.default.findAll();
            expect(database_1.default.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM content'));
            expect(result).toHaveLength(3);
        }));
        it('should return empty array when no content exists', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([]));
            const result = yield content_model_1.default.findAll();
            expect(result).toHaveLength(0);
        }));
        it('should handle JSON meta parsing', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockContent = Object.assign(Object.assign({}, (0, content_factory_1.createMockContent)()), { meta: JSON.stringify({ description: 'test' }) });
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([mockContent]));
            const result = yield content_model_1.default.findAll();
            expect(result[0].meta).toEqual({ description: 'test' });
        }));
    });
    describe('findById', () => {
        it('should return content by id', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockContent = (0, content_factory_1.createMockContent)({ id: 123 });
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([mockContent]));
            const result = yield content_model_1.default.findById(123);
            expect(database_1.default.query).toHaveBeenCalledWith(expect.stringContaining('WHERE id = $1'), [123]);
            expect(result === null || result === void 0 ? void 0 : result.id).toBe(123);
        }));
        it('should return null when content not found', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([]));
            const result = yield content_model_1.default.findById(999);
            expect(result).toBeNull();
        }));
    });
    describe('findBySlug', () => {
        it('should return content by slug', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockContent = (0, content_factory_1.createMockContent)({ slug: 'test-slug' });
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([mockContent]));
            const result = yield content_model_1.default.findBySlug('test-slug');
            expect(database_1.default.query).toHaveBeenCalledWith(expect.stringContaining('WHERE slug = $1'), ['test-slug']);
            expect(result === null || result === void 0 ? void 0 : result.slug).toBe('test-slug');
        }));
        it('should return null when slug not found', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([]));
            const result = yield content_model_1.default.findBySlug('nonexistent');
            expect(result).toBeNull();
        }));
    });
    describe('delete', () => {
        it('should delete content by id and return true', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([], 1));
            const result = yield content_model_1.default.delete(123);
            expect(database_1.default.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM content WHERE id = $1'), [123]);
            expect(result).toBe(true);
        }));
        it('should return false when content not found', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([], 0));
            const result = yield content_model_1.default.delete(999);
            expect(result).toBe(false);
        }));
    });
    describe('deleteAll', () => {
        it('should delete all content and return count', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([], 5));
            const result = yield content_model_1.default.deleteAll();
            expect(database_1.default.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM content'));
            expect(result).toBe(5);
        }));
    });
});
