// test/mocks/database.mock.ts
// Mock database for unit testing

export const mockQueryResult = {
  rows: [],
  rowCount: 0,
  command: '',
  oid: 0,
  fields: []
};

export const createMockQueryResult = <T>(rows: T[], rowCount?: number) => ({
  rows,
  rowCount: rowCount ?? rows.length,
  command: 'SELECT',
  oid: 0,
  fields: []
});

export const mockDatabase = {
  connect: jest.fn().mockResolvedValue(undefined),
  query: jest.fn().mockResolvedValue(mockQueryResult),
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
export const resetDatabaseMocks = () => {
  mockDatabase.connect.mockClear();
  mockDatabase.query.mockClear();
  mockDatabase.getClient.mockClear();
  mockDatabase.close.mockClear();
  mockDatabase.initializeTables.mockClear();
};

export default mockDatabase;
