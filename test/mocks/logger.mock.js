"use strict";
// test/mocks/logger.mock.ts
// Mock logger for unit testing
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetLoggerMocks = exports.mockLogger = void 0;
exports.mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn()
};
const resetLoggerMocks = () => {
    exports.mockLogger.info.mockClear();
    exports.mockLogger.error.mockClear();
    exports.mockLogger.warn.mockClear();
    exports.mockLogger.debug.mockClear();
    exports.mockLogger.log.mockClear();
};
exports.resetLoggerMocks = resetLoggerMocks;
exports.default = exports.mockLogger;
