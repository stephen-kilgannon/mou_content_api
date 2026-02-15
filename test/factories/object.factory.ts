// test/factories/object.factory.ts
// Factory for creating test object data

import { IObject, IContentItem } from '../../src/models/object.model';

let objectIdCounter = 1;

export const createMockItem = (overrides: Partial<IContentItem> = {}): IContentItem => ({
  type: 'task',
  title: 'Test Task',
  description: 'Test task description',
  status: 'pending',
  completed: false,
  metadata: {
    tags: ['test']
  },
  ...overrides
});

export const createMockObject = (overrides: Partial<IObject> = {}): IObject => {
  const id = objectIdCounter++;
  return {
    id,
    title: `Test Object ${id}`,
    description: `This is test object description ${id}`,
    user_id: `user-${id}`,
    due_date: new Date('2026-12-31'),
    type: 'object',
    metadata: { category: 'test' },
    items: [createMockItem()],
    upvotes: 0,
    downvotes: 0,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };
};

export const createMockObjectInput = (overrides: Partial<Omit<IObject, 'id' | 'created_at' | 'updated_at'>> = {}) => ({
  title: 'New Test Object',
  description: 'This is a new test object',
  user_id: null,
  due_date: null,
  type: 'object',
  metadata: {},
  items: [],
  upvotes: 0,
  downvotes: 0,
  ...overrides
});

export const resetObjectIdCounter = () => {
  objectIdCounter = 1;
};
