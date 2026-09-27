"use strict";
// test/mocks/database.mock.ts
// Mock database for unit testing
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDatabaseMocks = exports.mockDatabase = exports.createMockQueryResult = exports.mockQueryResult = void 0;
exports.mockQueryResult = {
    rows: [],
    rowCount: 0,
    command: '',
    oid: 0,
    fields: []
};
const createMockQueryResult = (rows, rowCount) => ({
    rows,
    rowCount: rowCount !== null && rowCount !== void 0 ? rowCount : rows.length,
    command: 'SELECT',
    oid: 0,
    fields: []
});
exports.createMockQueryResult = createMockQueryResult;
exports.mockDatabase = {
    connect: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue(exports.mockQueryResult),
    getClient: jest.fn().mockResolvedValue({
        query: jest.fn(),
        release: jest.fn()
    }),
    close: jest.fn().mockResolvedValue(undefined),
    initializeTables: jest.fn().mockResolvedValue(undefined),
    pool: {
        query: jest.fn(),
        connect: jest.fn(),
        end: jest.fn()
    }
};
// Reset all mocks
const resetDatabaseMocks = () => {
    exports.mockDatabase.connect.mockClear();
    exports.mockDatabase.query.mockClear();
    exports.mockDatabase.getClient.mockClear();
    exports.mockDatabase.close.mockClear();
    exports.mockDatabase.initializeTables.mockClear();
};
exports.resetDatabaseMocks = resetDatabaseMocks;
exports.default = exports.mockDatabase;
