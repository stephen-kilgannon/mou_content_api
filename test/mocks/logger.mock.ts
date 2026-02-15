// test/mocks/logger.mock.ts
// Mock logger for unit testing

export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  log: jest.fn()
};

export const resetLoggerMocks = () => {
  mockLogger.info.mockClear();
  mockLogger.error.mockClear();
  mockLogger.warn.mockClear();
  mockLogger.debug.mockClear();
  mockLogger.log.mockClear();
};

export default mockLogger;
