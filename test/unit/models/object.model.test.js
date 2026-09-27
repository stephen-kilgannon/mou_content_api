"use strict";
// test/unit/models/object.model.test.ts
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
const object_factory_1 = require("../../factories/object.factory");
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
const object_model_1 = __importDefault(require("../../../src/models/object.model"));
const database_1 = __importDefault(require("../../../src/utils/database"));
describe('ObjectModel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (0, object_factory_1.resetObjectIdCounter)();
    });
    describe('create', () => {
        it('should create a new object with all fields', () => __awaiter(void 0, void 0, void 0, function* () {
            const input = (0, object_factory_1.createMockObjectInput)({
                title: 'Test Object',
                description: 'Test description',
                type: 'task'
            });
            const expectedObject = (0, object_factory_1.createMockObject)(input);
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([expectedObject]));
            const result = yield object_model_1.default.create(input);
            expect(database_1.default.query).toHaveBeenCalledTimes(1);
            expect(database_1.default.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO objects'), expect.arrayContaining([input.title, input.description]));
            expect(result.title).toBe(input.title);
        }));
        it('should default type to "object" if not provided', () => __awaiter(void 0, void 0, void 0, function* () {
            const input = (0, object_factory_1.createMockObjectInput)();
            delete input.type;
            const expectedObject = (0, object_factory_1.createMockObject)(Object.assign(Object.assign({}, input), { type: 'object' }));
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([expectedObject]));
            yield object_model_1.default.create(input);
            expect(database_1.default.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO objects'), expect.arrayContaining(['object']));
        }));
        it('should serialize metadata and items as JSON', () => __awaiter(void 0, void 0, void 0, function* () {
            const input = (0, object_factory_1.createMockObjectInput)({
                metadata: { key: 'value' },
                items: [(0, object_factory_1.createMockItem)()]
            });
            const expectedObject = (0, object_factory_1.createMockObject)(input);
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([expectedObject]));
            yield object_model_1.default.create(input);
            const callArgs = database_1.default.query.mock.calls[0][1];
            expect(callArgs).toContainEqual(JSON.stringify({ key: 'value' }));
        }));
        it('should throw error on database failure', () => __awaiter(void 0, void 0, void 0, function* () {
            const input = (0, object_factory_1.createMockObjectInput)();
            database_1.default.query.mockRejectedValueOnce(new Error('Database error'));
            yield expect(object_model_1.default.create(input)).rejects.toThrow('Database error');
        }));
    });
    describe('findAll', () => {
        it('should return paginated objects with total count', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockObjects = [(0, object_factory_1.createMockObject)(), (0, object_factory_1.createMockObject)()];
            // First call for count
            database_1.default.query
                .mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([{ count: '10' }]))
                // Second call for objects
                .mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)(mockObjects));
            const result = yield object_model_1.default.findAll({}, 10, 0);
            expect(result.objects).toHaveLength(2);
            expect(result.total).toBe(10);
        }));
        it('should filter by type', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.default.query
                .mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([{ count: '5' }]))
                .mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([]));
            yield object_model_1.default.findAll({ type: 'task' }, 10, 0);
            expect(database_1.default.query).toHaveBeenCalledWith(expect.stringContaining('type = $1'), expect.arrayContaining(['task']));
        }));
        it('should filter by user_id', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.default.query
                .mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([{ count: '3' }]))
                .mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([]));
            yield object_model_1.default.findAll({ user_id: 'user-123' }, 10, 0);
            expect(database_1.default.query).toHaveBeenCalledWith(expect.stringContaining('user_id = $'), expect.arrayContaining(['user-123']));
        }));
        it('should apply limit and offset', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.default.query
                .mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([{ count: '100' }]))
                .mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([]));
            yield object_model_1.default.findAll({}, 20, 40);
            expect(database_1.default.query).toHaveBeenCalledWith(expect.stringContaining('LIMIT'), expect.arrayContaining([20, 40]));
        }));
    });
    describe('findById', () => {
        it('should return object by id', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockObject = (0, object_factory_1.createMockObject)({ id: 456 });
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([mockObject]));
            const result = yield object_model_1.default.findById(456);
            expect(database_1.default.query).toHaveBeenCalledWith(expect.stringContaining('WHERE id = $1'), [456]);
            expect(result === null || result === void 0 ? void 0 : result.id).toBe(456);
        }));
        it('should return null when object not found', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([]));
            const result = yield object_model_1.default.findById(999);
            expect(result).toBeNull();
        }));
        it('should parse JSON metadata and items', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockObject = Object.assign(Object.assign({}, (0, object_factory_1.createMockObject)()), { metadata: JSON.stringify({ key: 'value' }), items: JSON.stringify([{ type: 'task' }]) });
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([mockObject]));
            const result = yield object_model_1.default.findById(1);
            expect(result === null || result === void 0 ? void 0 : result.metadata).toEqual({ key: 'value' });
            expect(result === null || result === void 0 ? void 0 : result.items).toEqual([{ type: 'task' }]);
        }));
    });
    describe('update', () => {
        it('should update object fields', () => __awaiter(void 0, void 0, void 0, function* () {
            const updatedObject = (0, object_factory_1.createMockObject)({ title: 'Updated Title' });
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([updatedObject]));
            const result = yield object_model_1.default.update(1, { title: 'Updated Title' });
            expect(database_1.default.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE objects SET'), expect.any(Array));
            expect(result === null || result === void 0 ? void 0 : result.title).toBe('Updated Title');
        }));
        it('should return null when object not found', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([]));
            const result = yield object_model_1.default.update(999, { title: 'Test' });
            expect(result).toBeNull();
        }));
    });
    describe('delete', () => {
        it('should delete object by id and return true', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([], 1));
            const result = yield object_model_1.default.delete(123);
            expect(database_1.default.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM objects WHERE id = $1'), [123]);
            expect(result).toBe(true);
        }));
        it('should return false when object not found', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([], 0));
            const result = yield object_model_1.default.delete(999);
            expect(result).toBe(false);
        }));
    });
    describe('updateVotes', () => {
        it('should increment upvotes', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockObject = (0, object_factory_1.createMockObject)({ upvotes: 5 });
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([Object.assign(Object.assign({}, mockObject), { upvotes: 6 })]));
            const result = yield object_model_1.default.updateVotes(1, 'upvote');
            expect(database_1.default.query).toHaveBeenCalledWith(expect.stringContaining('upvotes = upvotes + 1'), [1]);
            expect(result === null || result === void 0 ? void 0 : result.upvotes).toBe(6);
        }));
        it('should increment downvotes', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockObject = (0, object_factory_1.createMockObject)({ downvotes: 2 });
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([Object.assign(Object.assign({}, mockObject), { downvotes: 3 })]));
            const result = yield object_model_1.default.updateVotes(1, 'downvote');
            expect(database_1.default.query).toHaveBeenCalledWith(expect.stringContaining('downvotes = downvotes + 1'), [1]);
            expect(result === null || result === void 0 ? void 0 : result.downvotes).toBe(3);
        }));
    });
    describe('deleteAll', () => {
        it('should delete all objects and return count', () => __awaiter(void 0, void 0, void 0, function* () {
            database_1.default.query.mockResolvedValueOnce((0, database_mock_1.createMockQueryResult)([], 10));
            const result = yield object_model_1.default.deleteAll();
            expect(database_1.default.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM objects'));
            expect(result).toBe(10);
        }));
    });
});
