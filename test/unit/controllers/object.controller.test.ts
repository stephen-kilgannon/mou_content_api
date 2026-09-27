// test/unit/controllers/object.controller.test.ts

import { Request, Response } from 'express';
import { createMockObject, createMockObjectInput, createMockItem } from '../../factories/object.factory';

// Mock models and logger before imports
jest.mock('../../../src/models/object.model');
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

import * as objectController from '../../../src/controllers/object.controller';
import ObjectModel from '../../../src/models/object.model';

describe('ObjectController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

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
    it('should create object and return 201', async () => {
      const input = { title: 'Test', description: 'Test desc' };
      const created = createMockObject(input);

      mockRequest.body = input;
      (ObjectModel.create as jest.Mock).mockResolvedValueOnce(created);

      await objectController.createObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(created);
    });

    it('should return 400 when title is missing', async () => {
      mockRequest.body = { description: 'Test desc' };

      await objectController.createObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Title and description are required'
      });
    });

    it('should return 400 when description is missing', async () => {
      mockRequest.body = { title: 'Test' };

      await objectController.createObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 500 on error', async () => {
      mockRequest.body = { title: 'Test', description: 'Test desc' };
      (ObjectModel.create as jest.Mock).mockRejectedValueOnce(new Error('DB Error'));

      await objectController.createObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
    });

    it('should handle invalid metadata gracefully', async () => {
      const input = { title: 'Test', description: 'Test desc', metadata: 'invalid' };
      const created = createMockObject({ ...input, metadata: {} });

      mockRequest.body = input;
      (ObjectModel.create as jest.Mock).mockResolvedValueOnce(created);

      await objectController.createObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(201);
    });
  });

  describe('getAllObjects', () => {
    it('should return paginated objects with 200', async () => {
      const objects = [createMockObject(), createMockObject()];
      const result = { objects, total: 10 };

      mockRequest.query = { limit: '10', offset: '0' };
      (ObjectModel.findAll as jest.Mock).mockResolvedValueOnce(result);

      await objectController.getAllObjects(
        mockRequest as Request,
        mockResponse as Response
      );

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
    });

    it('should apply type filter', async () => {
      mockRequest.query = { type: 'task' };
      (ObjectModel.findAll as jest.Mock).mockResolvedValueOnce({ objects: [], total: 0 });

      await objectController.getAllObjects(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ObjectModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'task' }),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should indicate hasMore when more results exist', async () => {
      mockRequest.query = { limit: '10', offset: '0' };
      (ObjectModel.findAll as jest.Mock).mockResolvedValueOnce({ objects: [], total: 50 });

      await objectController.getAllObjects(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({ hasMore: true })
        })
      );
    });
  });

  describe('getObjectById', () => {
    it('should return object by id with 200', async () => {
      const obj = createMockObject({ id: 123 });
      mockRequest.params = { id: '123' };
      (ObjectModel.findById as jest.Mock).mockResolvedValueOnce(obj);

      await objectController.getObjectById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ObjectModel.findById).toHaveBeenCalledWith(123);
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when object not found', async () => {
      mockRequest.params = { id: '999' };
      (ObjectModel.findById as jest.Mock).mockResolvedValueOnce(null);

      await objectController.getObjectById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('updateObject', () => {
    it('should update object and return 200', async () => {
      const updated = createMockObject({ title: 'Updated' });
      mockRequest.params = { id: '123' };
      mockRequest.body = { title: 'Updated' };
      (ObjectModel.update as jest.Mock).mockResolvedValueOnce(updated);

      await objectController.updateObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should convert userId to user_id', async () => {
      const updated = createMockObject();
      mockRequest.params = { id: '123' };
      mockRequest.body = { userId: 'user-123' };
      (ObjectModel.update as jest.Mock).mockResolvedValueOnce(updated);

      await objectController.updateObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ObjectModel.update).toHaveBeenCalledWith(
        123,
        expect.objectContaining({ user_id: 'user-123' })
      );
    });

    it('should return 404 when object not found', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { title: 'Updated' };
      (ObjectModel.update as jest.Mock).mockResolvedValueOnce(null);

      await objectController.updateObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteObject', () => {
    it('should delete object and return 200', async () => {
      mockRequest.params = { id: '123' };
      (ObjectModel.delete as jest.Mock).mockResolvedValueOnce(true);

      await objectController.deleteObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Object deleted successfully' });
    });

    it('should return 404 when object not found', async () => {
      mockRequest.params = { id: '999' };
      (ObjectModel.delete as jest.Mock).mockResolvedValueOnce(false);

      await objectController.deleteObject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('updateObjectVotes', () => {
    it('should handle upvote', async () => {
      const obj = createMockObject({ upvotes: 5 });
      mockRequest.params = { id: '123' };
      mockRequest.body = { type: 'upvote' };
      (ObjectModel.updateVotes as jest.Mock).mockResolvedValueOnce(obj);

      await objectController.updateObjectVotes(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ObjectModel.updateVotes).toHaveBeenCalledWith(123, 'upvote');
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'upvote recorded successfully' })
      );
    });

    it('should handle downvote', async () => {
      const obj = createMockObject({ downvotes: 3 });
      mockRequest.params = { id: '123' };
      mockRequest.body = { type: 'downvote' };
      (ObjectModel.updateVotes as jest.Mock).mockResolvedValueOnce(obj);

      await objectController.updateObjectVotes(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ObjectModel.updateVotes).toHaveBeenCalledWith(123, 'downvote');
    });

    it('should return 400 for invalid vote type', async () => {
      mockRequest.params = { id: '123' };
      mockRequest.body = { type: 'invalid' };

      await objectController.updateObjectVotes(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when object not found', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { type: 'upvote' };
      (ObjectModel.updateVotes as jest.Mock).mockResolvedValueOnce(null);

      await objectController.updateObjectVotes(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('updateObjectItem', () => {
    it('should update specific item in object', async () => {
      const obj = createMockObject({
        items: [createMockItem(), createMockItem()]
      });
      mockRequest.params = { id: '123', itemIndex: '0' };
      mockRequest.body = { status: 'completed' };

      (ObjectModel.findById as jest.Mock).mockResolvedValueOnce(obj);
      (ObjectModel.update as jest.Mock).mockResolvedValueOnce({
        ...obj,
        items: [{ ...obj.items[0], status: 'completed' }, obj.items[1]]
      });

      await objectController.updateObjectItem(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Item updated successfully' })
      );
    });

    it('should return 404 when object not found', async () => {
      mockRequest.params = { id: '999', itemIndex: '0' };
      mockRequest.body = { status: 'completed' };
      (ObjectModel.findById as jest.Mock).mockResolvedValueOnce(null);

      await objectController.updateObjectItem(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 400 for invalid item index', async () => {
      const obj = createMockObject({ items: [createMockItem()] });
      mockRequest.params = { id: '123', itemIndex: '5' };
      mockRequest.body = { status: 'completed' };
      (ObjectModel.findById as jest.Mock).mockResolvedValueOnce(obj);

      await objectController.updateObjectItem(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid item index' });
    });
  });

  describe('cleanObjects', () => {
    it('should clean all objects and return count', async () => {
      (ObjectModel.deleteAll as jest.Mock).mockResolvedValueOnce(15);

      await objectController.cleanObjects(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'All objects cleaned successfully',
        deletedCount: 15
      });
    });
  });
});
