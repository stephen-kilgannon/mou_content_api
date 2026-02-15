"use strict";
// test/factories/object.factory.ts
// Factory for creating test object data
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetObjectIdCounter = exports.createMockObjectInput = exports.createMockObject = exports.createMockItem = void 0;
let objectIdCounter = 1;
const createMockItem = (overrides = {}) => (Object.assign({ type: 'task', title: 'Test Task', description: 'Test task description', status: 'pending', completed: false, metadata: {
        tags: ['test']
    } }, overrides));
exports.createMockItem = createMockItem;
const createMockObject = (overrides = {}) => {
    const id = objectIdCounter++;
    return Object.assign({ id, title: `Test Object ${id}`, description: `This is test object description ${id}`, user_id: `user-${id}`, due_date: new Date('2026-12-31'), type: 'object', metadata: { category: 'test' }, items: [(0, exports.createMockItem)()], upvotes: 0, downvotes: 0, created_at: new Date(), updated_at: new Date() }, overrides);
};
exports.createMockObject = createMockObject;
const createMockObjectInput = (overrides = {}) => (Object.assign({ title: 'New Test Object', description: 'This is a new test object', user_id: null, due_date: null, type: 'object', metadata: {}, items: [], upvotes: 0, downvotes: 0 }, overrides));
exports.createMockObjectInput = createMockObjectInput;
const resetObjectIdCounter = () => {
    objectIdCounter = 1;
};
exports.resetObjectIdCounter = resetObjectIdCounter;
