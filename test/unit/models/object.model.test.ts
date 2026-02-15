// test/unit/models/object.model.test.ts

import { createMockObject, createMockObjectInput, createMockItem, resetObjectIdCounter } from '../../factories/object.factory';
import { createMockQueryResult } from '../../mocks/database.mock';

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

import ObjectModel from '../../../src/models/object.model';
import database from '../../../src/utils/database';

describe('ObjectModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetObjectIdCounter();
  });

  describe('create', () => {
    it('should create a new object with all fields', async () => {
      const input = createMockObjectInput({
        title: 'Test Object',
        description: 'Test description',
        type: 'task'
      });
      const expectedObject = createMockObject(input);

      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([expectedObject])
      );

      const result = await ObjectModel.create(input);

      expect(database.query).toHaveBeenCalledTimes(1);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO objects'),
        expect.arrayContaining([input.title, input.description])
      );
      expect(result.title).toBe(input.title);
    });

    it('should default type to "object" if not provided', async () => {
      const input = createMockObjectInput();
      delete (input as any).type;
      const expectedObject = createMockObject({ ...input, type: 'object' });

      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([expectedObject])
      );

      await ObjectModel.create(input as any);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO objects'),
        expect.arrayContaining(['object'])
      );
    });

    it('should serialize metadata and items as JSON', async () => {
      const input = createMockObjectInput({
        metadata: { key: 'value' },
        items: [createMockItem()]
      });
      const expectedObject = createMockObject(input);

      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([expectedObject])
      );

      await ObjectModel.create(input);

      const callArgs = (database.query as jest.Mock).mock.calls[0][1];
      expect(callArgs).toContainEqual(JSON.stringify({ key: 'value' }));
    });

    it('should throw error on database failure', async () => {
      const input = createMockObjectInput();
      (database.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      await expect(ObjectModel.create(input)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return paginated objects with total count', async () => {
      const mockObjects = [createMockObject(), createMockObject()];

      // First call for count
      (database.query as jest.Mock)
        .mockResolvedValueOnce(createMockQueryResult([{ count: '10' }]))
        // Second call for objects
        .mockResolvedValueOnce(createMockQueryResult(mockObjects));

      const result = await ObjectModel.findAll({}, 10, 0);

      expect(result.objects).toHaveLength(2);
      expect(result.total).toBe(10);
    });

    it('should filter by type', async () => {
      (database.query as jest.Mock)
        .mockResolvedValueOnce(createMockQueryResult([{ count: '5' }]))
        .mockResolvedValueOnce(createMockQueryResult([]));

      await ObjectModel.findAll({ type: 'task' }, 10, 0);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('type = $1'),
        expect.arrayContaining(['task'])
      );
    });

    it('should filter by user_id', async () => {
      (database.query as jest.Mock)
        .mockResolvedValueOnce(createMockQueryResult([{ count: '3' }]))
        .mockResolvedValueOnce(createMockQueryResult([]));

      await ObjectModel.findAll({ user_id: 'user-123' }, 10, 0);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('user_id = $'),
        expect.arrayContaining(['user-123'])
      );
    });

    it('should apply limit and offset', async () => {
      (database.query as jest.Mock)
        .mockResolvedValueOnce(createMockQueryResult([{ count: '100' }]))
        .mockResolvedValueOnce(createMockQueryResult([]));

      await ObjectModel.findAll({}, 20, 40);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([20, 40])
      );
    });
  });

  describe('findById', () => {
    it('should return object by id', async () => {
      const mockObject = createMockObject({ id: 456 });

      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([mockObject])
      );

      const result = await ObjectModel.findById(456);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [456]
      );
      expect(result?.id).toBe(456);
    });

    it('should return null when object not found', async () => {
      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([])
      );

      const result = await ObjectModel.findById(999);

      expect(result).toBeNull();
    });

    it('should parse JSON metadata and items', async () => {
      const mockObject = {
        ...createMockObject(),
        metadata: JSON.stringify({ key: 'value' }),
        items: JSON.stringify([{ type: 'task' }])
      };

      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([mockObject])
      );

      const result = await ObjectModel.findById(1);

      expect(result?.metadata).toEqual({ key: 'value' });
      expect(result?.items).toEqual([{ type: 'task' }]);
    });
  });

  describe('update', () => {
    it('should update object fields', async () => {
      const updatedObject = createMockObject({ title: 'Updated Title' });

      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([updatedObject])
      );

      const result = await ObjectModel.update(1, { title: 'Updated Title' });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE objects'),
        expect.any(Array)
      );
      expect(result?.title).toBe('Updated Title');
    });

    it('should return null when object not found', async () => {
      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([])
      );

      const result = await ObjectModel.update(999, { title: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete object by id and return true', async () => {
      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([], 1)
      );

      const result = await ObjectModel.delete(123);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM objects WHERE id = $1'),
        [123]
      );
      expect(result).toBe(true);
    });

    it('should return false when object not found', async () => {
      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([], 0)
      );

      const result = await ObjectModel.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('updateVotes', () => {
    it('should increment upvotes', async () => {
      const mockObject = createMockObject({ upvotes: 5 });

      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([{ ...mockObject, upvotes: 6 }])
      );

      const result = await ObjectModel.updateVotes(1, 'upvote');

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('upvotes = upvotes + 1'),
        [1]
      );
      expect(result?.upvotes).toBe(6);
    });

    it('should increment downvotes', async () => {
      const mockObject = createMockObject({ downvotes: 2 });

      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([{ ...mockObject, downvotes: 3 }])
      );

      const result = await ObjectModel.updateVotes(1, 'downvote');

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('downvotes = downvotes + 1'),
        [1]
      );
      expect(result?.downvotes).toBe(3);
    });
  });

  describe('deleteAll', () => {
    it('should delete all objects and return count', async () => {
      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([], 10)
      );

      const result = await ObjectModel.deleteAll();

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM objects')
      );
      expect(result).toBe(10);
    });
  });
});
