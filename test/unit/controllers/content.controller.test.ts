// test/unit/controllers/content.controller.test.ts

import { Request, Response } from 'express';
import { createMockContent, createMockContentInput } from '../../factories/content.factory';

// Mock models and logger before imports
jest.mock('../../../src/models/content.model');
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

import * as contentController from '../../../src/controllers/content.controller';
import ContentModel from '../../../src/models/content.model';

describe('ContentController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockSend: jest.Mock;

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
    it('should create content and return 201', async () => {
      const input = createMockContentInput();
      const created = createMockContent(input);

      mockRequest.body = input;
      (ContentModel.create as jest.Mock).mockResolvedValueOnce(created);

      await contentController.createContent(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ContentModel.create).toHaveBeenCalledWith(input);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(created);
    });

    it('should return 500 on error', async () => {
      mockRequest.body = createMockContentInput();
      (ContentModel.create as jest.Mock).mockRejectedValueOnce(new Error('DB Error'));

      await contentController.createContent(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to create content' });
    });
  });

  describe('getAllContent', () => {
    it('should return all content with 200', async () => {
      const contents = [createMockContent(), createMockContent()];
      (ContentModel.findAll as jest.Mock).mockResolvedValueOnce(contents);

      await contentController.getAllContent(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(contents);
    });

    it('should return 500 on error', async () => {
      (ContentModel.findAll as jest.Mock).mockRejectedValueOnce(new Error('DB Error'));

      await contentController.getAllContent(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
    });
  });

  describe('getContentById', () => {
    it('should return content by id with 200', async () => {
      const content = createMockContent({ id: 123 });
      mockRequest.params = { id: '123' };
      (ContentModel.findById as jest.Mock).mockResolvedValueOnce(content);

      await contentController.getContentById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ContentModel.findById).toHaveBeenCalledWith(123);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(content);
    });

    it('should return 404 when content not found', async () => {
      mockRequest.params = { id: '999' };
      (ContentModel.findById as jest.Mock).mockResolvedValueOnce(null);

      await contentController.getContentById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Content not found' });
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { id: '123' };
      (ContentModel.findById as jest.Mock).mockRejectedValueOnce(new Error('DB Error'));

      await contentController.getContentById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
    });
  });

  describe('getContentBySlug', () => {
    it('should return content by slug with 200', async () => {
      const content = createMockContent({ slug: 'test-slug' });
      mockRequest.params = { slug: 'test-slug' };
      (ContentModel.findBySlug as jest.Mock).mockResolvedValueOnce(content);

      await contentController.getContentBySlug(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ContentModel.findBySlug).toHaveBeenCalledWith('test-slug');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when slug not found', async () => {
      mockRequest.params = { slug: 'nonexistent' };
      (ContentModel.findBySlug as jest.Mock).mockResolvedValueOnce(null);

      await contentController.getContentBySlug(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteContent', () => {
    it('should delete content and return 204', async () => {
      mockRequest.params = { id: '123' };
      (ContentModel.delete as jest.Mock).mockResolvedValueOnce(true);

      await contentController.deleteContent(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ContentModel.delete).toHaveBeenCalledWith(123);
      expect(mockStatus).toHaveBeenCalledWith(204);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should return 404 when content not found', async () => {
      mockRequest.params = { id: '999' };
      (ContentModel.delete as jest.Mock).mockResolvedValueOnce(false);

      await contentController.deleteContent(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('cleanContent', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should return 403 in production mode', async () => {
      process.env.NODE_ENV = 'production';

      await contentController.cleanContent(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(403);
    });

    it('should clean content in development mode', async () => {
      process.env.NODE_ENV = 'development';
      (ContentModel.deleteAll as jest.Mock).mockResolvedValueOnce(5);

      await contentController.cleanContent(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'All content has been successfully deleted.',
        deletedCount: 5
      });
    });
  });
});
