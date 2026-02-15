// test/unit/models/content.model.test.ts

import { createMockContent, createMockContentInput, resetContentIdCounter } from '../../factories/content.factory';
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

import ContentModel from '../../../src/models/content.model';
import database from '../../../src/utils/database';

describe('ContentModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetContentIdCounter();
  });

  describe('create', () => {
    it('should create new content with auto-generated slug', async () => {
      const input = createMockContentInput({ title: 'My Test Title' });
      const expectedContent = createMockContent({
        ...input,
        slug: 'my-test-title'
      });

      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([expectedContent])
      );

      const result = await ContentModel.create(input);

      expect(database.query).toHaveBeenCalledTimes(1);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO content'),
        expect.arrayContaining([input.title, input.content, expect.any(String), 'my-test-title'])
      );
      expect(result.title).toBe(input.title);
    });

    it('should use provided slug if given', async () => {
      const input = createMockContentInput({ slug: 'custom-slug' });
      const expectedContent = createMockContent({ ...input });

      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([expectedContent])
      );

      await ContentModel.create(input);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO content'),
        expect.arrayContaining(['custom-slug'])
      );
    });

    it('should throw error on database failure', async () => {
      const input = createMockContentInput();
      (database.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      await expect(ContentModel.create(input)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return all content items', async () => {
      const mockContents = [
        createMockContent(),
        createMockContent(),
        createMockContent()
      ];

      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult(mockContents)
      );

      const result = await ContentModel.findAll();

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM content')
      );
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no content exists', async () => {
      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([])
      );

      const result = await ContentModel.findAll();

      expect(result).toHaveLength(0);
    });

    it('should handle JSON meta parsing', async () => {
      const mockContent = {
        ...createMockContent(),
        meta: JSON.stringify({ description: 'test' })
      };

      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([mockContent])
      );

      const result = await ContentModel.findAll();

      expect(result[0].meta).toEqual({ description: 'test' });
    });
  });

  describe('findById', () => {
    it('should return content by id', async () => {
      const mockContent = createMockContent({ id: 123 });

      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([mockContent])
      );

      const result = await ContentModel.findById(123);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [123]
      );
      expect(result?.id).toBe(123);
    });

    it('should return null when content not found', async () => {
      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([])
      );

      const result = await ContentModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('should return content by slug', async () => {
      const mockContent = createMockContent({ slug: 'test-slug' });

      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([mockContent])
      );

      const result = await ContentModel.findBySlug('test-slug');

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE slug = $1'),
        ['test-slug']
      );
      expect(result?.slug).toBe('test-slug');
    });

    it('should return null when slug not found', async () => {
      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([])
      );

      const result = await ContentModel.findBySlug('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete content by id and return true', async () => {
      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([], 1)
      );

      const result = await ContentModel.delete(123);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM content WHERE id = $1'),
        [123]
      );
      expect(result).toBe(true);
    });

    it('should return false when content not found', async () => {
      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([], 0)
      );

      const result = await ContentModel.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('deleteAll', () => {
    it('should delete all content and return count', async () => {
      (database.query as jest.Mock).mockResolvedValueOnce(
        createMockQueryResult([], 5)
      );

      const result = await ContentModel.deleteAll();

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM content')
      );
      expect(result).toBe(5);
    });
  });
});
