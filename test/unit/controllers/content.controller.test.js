"use strict";
// test/unit/controllers/content.controller.test.ts
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
const content_factory_1 = require("../../factories/content.factory");
// Mock models and logger before imports
jest.mock('../../../src/models/content.model');
jest.mock('../../../src/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
}));
const contentController = __importStar(require("../../../src/controllers/content.controller"));
const content_model_1 = __importDefault(require("../../../src/models/content.model"));
describe('ContentController', () => {
    let mockRequest;
    let mockResponse;
    let mockJson;
    let mockStatus;
    let mockSend;
    beforeEach(() => {
        mockJson = jest.fn();
        mockSend = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson, send: mockSend });
        mockRequest = {
            body: {},
            params: {},
            query: {}
        };
        mockResponse = {
            status: mockStatus,
            json: mockJson,
            send: mockSend
        };
        jest.clearAllMocks();
    });
    describe('createContent', () => {
        it('should create content and return 201', () => __awaiter(void 0, void 0, void 0, function* () {
            const input = (0, content_factory_1.createMockContentInput)();
            const created = (0, content_factory_1.createMockContent)(input);
            mockRequest.body = input;
            content_model_1.default.create.mockResolvedValueOnce(created);
            yield contentController.createContent(mockRequest, mockResponse);
            expect(content_model_1.default.create).toHaveBeenCalledWith(input);
            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith(created);
        }));
        it('should return 500 on error', () => __awaiter(void 0, void 0, void 0, function* () {
            mockRequest.body = (0, content_factory_1.createMockContentInput)();
            content_model_1.default.create.mockRejectedValueOnce(new Error('DB Error'));
            yield contentController.createContent(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to create content' });
        }));
    });
    describe('getAllContent', () => {
        it('should return all content with 200', () => __awaiter(void 0, void 0, void 0, function* () {
            const contents = [(0, content_factory_1.createMockContent)(), (0, content_factory_1.createMockContent)()];
            content_model_1.default.findAll.mockResolvedValueOnce(contents);
            yield contentController.getAllContent(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(contents);
        }));
        it('should return 500 on error', () => __awaiter(void 0, void 0, void 0, function* () {
            content_model_1.default.findAll.mockRejectedValueOnce(new Error('DB Error'));
            yield contentController.getAllContent(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(500);
        }));
    });
    describe('getContentById', () => {
        it('should return content by id with 200', () => __awaiter(void 0, void 0, void 0, function* () {
            const content = (0, content_factory_1.createMockContent)({ id: 123 });
            mockRequest.params = { id: '123' };
            content_model_1.default.findById.mockResolvedValueOnce(content);
            yield contentController.getContentById(mockRequest, mockResponse);
            expect(content_model_1.default.findById).toHaveBeenCalledWith(123);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(content);
        }));
        it('should return 404 when content not found', () => __awaiter(void 0, void 0, void 0, function* () {
            mockRequest.params = { id: '999' };
            content_model_1.default.findById.mockResolvedValueOnce(null);
            yield contentController.getContentById(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Content not found' });
        }));
        it('should return 500 on error', () => __awaiter(void 0, void 0, void 0, function* () {
            mockRequest.params = { id: '123' };
            content_model_1.default.findById.mockRejectedValueOnce(new Error('DB Error'));
            yield contentController.getContentById(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(500);
        }));
    });
    describe('getContentBySlug', () => {
        it('should return content by slug with 200', () => __awaiter(void 0, void 0, void 0, function* () {
            const content = (0, content_factory_1.createMockContent)({ slug: 'test-slug' });
            mockRequest.params = { slug: 'test-slug' };
            content_model_1.default.findBySlug.mockResolvedValueOnce(content);
            yield contentController.getContentBySlug(mockRequest, mockResponse);
            expect(content_model_1.default.findBySlug).toHaveBeenCalledWith('test-slug');
            expect(mockStatus).toHaveBeenCalledWith(200);
        }));
        it('should return 404 when slug not found', () => __awaiter(void 0, void 0, void 0, function* () {
            mockRequest.params = { slug: 'nonexistent' };
            content_model_1.default.findBySlug.mockResolvedValueOnce(null);
            yield contentController.getContentBySlug(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(404);
        }));
    });
    describe('deleteContent', () => {
        it('should delete content and return 204', () => __awaiter(void 0, void 0, void 0, function* () {
            mockRequest.params = { id: '123' };
            content_model_1.default.delete.mockResolvedValueOnce(true);
            yield contentController.deleteContent(mockRequest, mockResponse);
            expect(content_model_1.default.delete).toHaveBeenCalledWith(123);
            expect(mockStatus).toHaveBeenCalledWith(204);
            expect(mockSend).toHaveBeenCalled();
        }));
        it('should return 404 when content not found', () => __awaiter(void 0, void 0, void 0, function* () {
            mockRequest.params = { id: '999' };
            content_model_1.default.delete.mockResolvedValueOnce(false);
            yield contentController.deleteContent(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(404);
        }));
    });
    describe('cleanContent', () => {
        const originalEnv = process.env.NODE_ENV;
        afterEach(() => {
            process.env.NODE_ENV = originalEnv;
        });
        it('should return 403 in production mode', () => __awaiter(void 0, void 0, void 0, function* () {
            process.env.NODE_ENV = 'production';
            yield contentController.cleanContent(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(403);
        }));
        it('should clean content in development mode', () => __awaiter(void 0, void 0, void 0, function* () {
            process.env.NODE_ENV = 'development';
            content_model_1.default.deleteAll.mockResolvedValueOnce(5);
            yield contentController.cleanContent(mockRequest, mockResponse);
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({
                message: 'All content has been successfully deleted.',
                deletedCount: 5
            });
        }));
    });
});
