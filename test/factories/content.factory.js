"use strict";
// test/factories/content.factory.ts
// Factory for creating test content data
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetContentIdCounter = exports.createMockContentInput = exports.createMockContent = void 0;
let contentIdCounter = 1;
const createMockContent = (overrides = {}) => {
    const id = contentIdCounter++;
    return Object.assign({ id, title: `Test Content ${id}`, content: `This is test content body ${id}`, meta: {
            description: `Test description ${id}`,
            keywords: ['test', 'mock'],
            author: 'Test Author',
            tags: ['unit-test']
        }, slug: `test-content-${id}`, created_at: new Date(), updated_at: new Date() }, overrides);
};
exports.createMockContent = createMockContent;
const createMockContentInput = (overrides = {}) => (Object.assign({ title: 'New Test Content', content: 'This is the body of new test content', meta: {
        description: 'New content description',
        keywords: ['new', 'test'],
        author: 'Test Author'
    } }, overrides));
exports.createMockContentInput = createMockContentInput;
const resetContentIdCounter = () => {
    contentIdCounter = 1;
};
exports.resetContentIdCounter = resetContentIdCounter;
