// test/factories/content.factory.ts
// Factory for creating test content data

import { IContent } from '../../src/models/content.model';

let contentIdCounter = 1;

export const createMockContent = (overrides: Partial<IContent> = {}): IContent => {
  const id = contentIdCounter++;
  return {
    id,
    title: `Test Content ${id}`,
    content: `This is test content body ${id}`,
    meta: {
      description: `Test description ${id}`,
      keywords: ['test', 'mock'],
      author: 'Test Author',
      tags: ['unit-test']
    },
    slug: `test-content-${id}`,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };
};

export const createMockContentInput = (overrides: Partial<Omit<IContent, 'id' | 'created_at' | 'updated_at'>> = {}) => ({
  title: 'New Test Content',
  content: 'This is the body of new test content',
  meta: {
    description: 'New content description',
    keywords: ['new', 'test'],
    author: 'Test Author'
  },
  ...overrides
});

export const resetContentIdCounter = () => {
  contentIdCounter = 1;
};
