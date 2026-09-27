"use strict";
// test/unit/controllers/object.controller.test.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
// Mock models and logger before imports
jest.mock('../../../src/models/object.model');
jest.mock('../../../src/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
}));
const objectController = __importStar(require("../../../src/controllers/object.controller"));
const object_model_1 = __importDefault(require("../../../src/models/object.model"));
describe('ObjectController', () => {
    let mockRequest;
    let mockResponse;
    let mockJson;
    let mockStatus;
    beforeEach(() => {
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        mockRequest = {
            body: {},
            params: {},
            query: {}
        };
        mockResponse = {
            status: mockStatus,
            json: mockJson
        };
        jest.clearAllMocks();
    });
    describe('createObject', () => {
        it('should create object and return 201', () => __awaiter(void 0, void 0, void 0, function* () {
            const input = { title: 'Test', description: 'Test desc' };
            const created = (0, object_factory_1.createMockObject)(input);
            mockRequest.body = input;
            object_model_1.default.create.mockResolvedValueOnce(created);
            yield objectController.createObject(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith(created);
        }));
        it('should return 400 when title is missing', () => __awaiter(void 0, void 0, void 0, function* () {
            mockRequest.body = { description: 'Test desc' };
            yield objectController.createObject(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({
                error: 'Title and description are required'
            });
        }));
        it('should return 400 when description is missing', () => __awaiter(void 0, void 0, void 0, function* () {
            mockRequest.body = { title: 'Test' };
            yield objectController.createObject(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(400);
        }));
        it('should return 500 on error', () => __awaiter(void 0, void 0, void 0, function* () {
            mockRequest.body = { title: 'Test', description: 'Test desc' };
            object_model_1.default.create.mockRejectedValueOnce(new Error('DB Error'));
            yield objectController.createObject(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(500);
        }));
        it('should handle invalid metadata gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            const input = { title: 'Test', description: 'Test desc', metadata: 'invalid' };
            const created = (0, object_factory_1.createMockObject)(Object.assign(Object.assign({}, input), { metadata: {} }));
            mockRequest.body = input;
            object_model_1.default.create.mockResolvedValueOnce(created);
            yield objectController.createObject(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(201);
        }));
    });
    describe('getAllObjects', () => {
        it('should return paginated objects with 200', () => __awaiter(void 0, void 0, void 0, function* () {
            const objects = [(0, object_factory_1.createMockObject)(), (0, object_factory_1.createMockObject)()];
            const result = { objects, total: 10 };
            mockRequest.query = { limit: '10', offset: '0' };
            object_model_1.default.findAll.mockResolvedValueOnce(result);
            yield objectController.getAllObjects(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({
                objects,
                pagination: {
                    total: 10,
                    limit: 10,
                    offset: 0,
                    hasMore: false
                }
            });
        }));
        it('should apply type filter', () => __awaiter(void 0, void 0, void 0, function* () {
            mockRequest.query = { type: 'task' };
            object_model_1.default.findAll.mockResolvedValueOnce({ objects: [], total: 0 });
            yield objectController.getAllObjects(mockRequest, mockResponse);
            expect(object_model_1.default.findAll).toHaveBeenCalledWith(expect.objectContaining({ type: 'task' }), expect.any(Number), expect.any(Number));
        }));
        it('should indicate hasMore when more results exist', () => __awaiter(void 0, void 0, void 0, function* () {
            mockRequest.query = { limit: '10', offset: '0' };
            object_model_1.default.findAll.mockResolvedValueOnce({ objects: [], total: 50 });
            yield objectController.getAllObjects(mockRequest, mockResponse);
            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
                pagination: expect.objectContaining({ hasMore: true })
            }));
        }));
    });
    describe('getObjectById', () => {
        it('should return object by id with 200', () => __awaiter(void 0, void 0, void 0, function* () {
            const obj = (0, object_factory_1.createMockObject)({ id: 123 });
            mockRequest.params = { id: '123' };
            object_model_1.default.findById.mockResolvedValueOnce(obj);
            yield objectController.getObjectById(mockRequest, mockResponse);
            expect(object_model_1.default.findById).toHaveBeenCalledWith(123);
            expect(mockStatus).toHaveBeenCalledWith(200);
        }));
        it('should return 404 when object not found', () => __awaiter(void 0, void 0, void 0, function* () {
            mockRequest.params = { id: '999' };
            object_model_1.default.findById.mockResolvedValueOnce(null);
            yield objectController.getObjectById(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(404);
        }));
    });
    describe('updateObject', () => {
        it('should update object and return 200', () => __awaiter(void 0, void 0, void 0, function* () {
            const updated = (0, object_factory_1.createMockObject)({ title: 'Updated' });
            mockRequest.params = { id: '123' };
            mockRequest.body = { title: 'Updated' };
            object_model_1.default.update.mockResolvedValueOnce(updated);
            yield objectController.updateObject(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(200);
        }));
        it('should convert userId to user_id', () => __awaiter(void 0, void 0, void 0, function* () {
            const updated = (0, object_factory_1.createMockObject)();
            mockRequest.params = { id: '123' };
            mockRequest.body = { userId: 'user-123' };
            object_model_1.default.update.mockResolvedValueOnce(updated);
            yield objectController.updateObject(mockRequest, mockResponse);
            expect(object_model_1.default.update).toHaveBeenCalledWith(123, expect.objectContaining({ user_id: 'user-123' }));
        }));
        it('should return 404 when object not found', () => __awaiter(void 0, void 0, void 0, function* () {
            mockRequest.params = { id: '999' };
            mockRequest.body = { title: 'Updated' };
            object_model_1.default.update.mockResolvedValueOnce(null);
            yield objectController.updateObject(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(404);
        }));
    });
    describe('deleteObject', () => {
        it('should delete object and return 200', () => __awaiter(void 0, void 0, void 0, function* () {
            mockRequest.params = { id: '123' };
            object_model_1.default.delete.mockResolvedValueOnce(true);
            yield objectController.deleteObject(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Object deleted successfully' });
        }));
        it('should return 404 when object not found', () => __awaiter(void 0, void 0, void 0, function* () {
            mockRequest.params = { id: '999' };
            object_model_1.default.delete.mockResolvedValueOnce(false);
            yield objectController.deleteObject(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(404);
        }));
    });
    describe('updateObjectVotes', () => {
        it('should handle upvote', () => __awaiter(void 0, void 0, void 0, function* () {
            const obj = (0, object_factory_1.createMockObject)({ upvotes: 5 });
            mockRequest.params = { id: '123' };
            mockRequest.body = { type: 'upvote' };
            object_model_1.default.updateVotes.mockResolvedValueOnce(obj);
            yield objectController.updateObjectVotes(mockRequest, mockResponse);
            expect(object_model_1.default.updateVotes).toHaveBeenCalledWith(123, 'upvote');
            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ message: 'upvote recorded successfully' }));
        }));
        it('should handle downvote', () => __awaiter(void 0, void 0, void 0, function* () {
            const obj = (0, object_factory_1.createMockObject)({ downvotes: 3 });
            mockRequest.params = { id: '123' };
            mockRequest.body = { type: 'downvote' };
            object_model_1.default.updateVotes.mockResolvedValueOnce(obj);
            yield objectController.updateObjectVotes(mockRequest, mockResponse);
            expect(object_model_1.default.updateVotes).toHaveBeenCalledWith(123, 'downvote');
        }));
        it('should return 400 for invalid vote type', () => __awaiter(void 0, void 0, void 0, function* () {
            mockRequest.params = { id: '123' };
            mockRequest.body = { type: 'invalid' };
            yield objectController.updateObjectVotes(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(400);
        }));
        it('should return 404 when object not found', () => __awaiter(void 0, void 0, void 0, function* () {
            mockRequest.params = { id: '999' };
            mockRequest.body = { type: 'upvote' };
            object_model_1.default.updateVotes.mockResolvedValueOnce(null);
            yield objectController.updateObjectVotes(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(404);
        }));
    });
    describe('updateObjectItem', () => {
        it('should update specific item in object', () => __awaiter(void 0, void 0, void 0, function* () {
            const obj = (0, object_factory_1.createMockObject)({
                items: [(0, object_factory_1.createMockItem)(), (0, object_factory_1.createMockItem)()]
            });
            mockRequest.params = { id: '123', itemIndex: '0' };
            mockRequest.body = { status: 'completed' };
            object_model_1.default.findById.mockResolvedValueOnce(obj);
            object_model_1.default.update.mockResolvedValueOnce(Object.assign(Object.assign({}, obj), { items: [Object.assign(Object.assign({}, obj.items[0]), { status: 'completed' }), obj.items[1]] }));
            yield objectController.updateObjectItem(mockRequest, mockResponse);
            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ message: 'Item updated successfully' }));
        }));
        it('should return 404 when object not found', () => __awaiter(void 0, void 0, void 0, function* () {
            mockRequest.params = { id: '999', itemIndex: '0' };
            mockRequest.body = { status: 'completed' };
            object_model_1.default.findById.mockResolvedValueOnce(null);
            yield objectController.updateObjectItem(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(404);
        }));
        it('should return 400 for invalid item index', () => __awaiter(void 0, void 0, void 0, function* () {
            const obj = (0, object_factory_1.createMockObject)({ items: [(0, object_factory_1.createMockItem)()] });
            mockRequest.params = { id: '123', itemIndex: '5' };
            mockRequest.body = { status: 'completed' };
            object_model_1.default.findById.mockResolvedValueOnce(obj);
            yield objectController.updateObjectItem(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid item index' });
        }));
    });
    describe('cleanObjects', () => {
        it('should clean all objects and return count', () => __awaiter(void 0, void 0, void 0, function* () {
            object_model_1.default.deleteAll.mockResolvedValueOnce(15);
            yield objectController.cleanObjects(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({
                message: 'All objects cleaned successfully',
                deletedCount: 15
            });
        }));
    });
});
