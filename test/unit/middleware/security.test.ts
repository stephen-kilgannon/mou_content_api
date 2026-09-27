// test/unit/middleware/security.test.ts

import { Request, Response, NextFunction } from 'express';
import {
  apiKeyAuth,
  requestIdMiddleware,
  sanitizeInput,
  validatePayloadSize
} from '../../../src/middleware/security';

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Security Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockSetHeader: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockSetHeader = jest.fn();
    mockNext = jest.fn();

    mockRequest = {
      headers: {},
      query: {},
      params: {},
      body: {},
      path: '/api/test',
      ip: '127.0.0.1'
    };

    mockResponse = {
      status: mockStatus,
      json: mockJson,
      setHeader: mockSetHeader
    };

    // Reset environment
    delete process.env.API_KEY;
    process.env.NODE_ENV = 'test';
  });

  describe('apiKeyAuth', () => {
    it('should skip auth for health endpoint', () => {
      mockRequest = { ...mockRequest, path: '/health' } as Partial<Request>;

      apiKeyAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('should skip auth when no API_KEY is set', () => {
      delete process.env.API_KEY;

      apiKeyAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip auth in development mode', () => {
      process.env.API_KEY = 'test-key';
      process.env.NODE_ENV = 'development';

      apiKeyAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip auth in test mode', () => {
      process.env.API_KEY = 'test-key';
      process.env.NODE_ENV = 'test';

      apiKeyAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when API key is missing in production', () => {
      process.env.API_KEY = 'test-key';
      process.env.NODE_ENV = 'production';

      apiKeyAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'API key required' });
    });

    it('should return 403 when API key is invalid in production', () => {
      process.env.API_KEY = 'correct-key';
      process.env.NODE_ENV = 'production';
      mockRequest.headers = { 'x-api-key': 'wrong-key' };

      apiKeyAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid API key' });
    });

    it('should allow request with valid API key', () => {
      process.env.API_KEY = 'valid-key';
      process.env.NODE_ENV = 'production';
      mockRequest.headers = { 'x-api-key': 'valid-key' };

      apiKeyAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('should accept API key from query parameter', () => {
      process.env.API_KEY = 'valid-key';
      process.env.NODE_ENV = 'production';
      mockRequest.query = { api_key: 'valid-key' };

      apiKeyAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requestIdMiddleware', () => {
    it('should generate a request ID if not provided', () => {
      requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.headers!['x-request-id']).toBeDefined();
      expect(mockSetHeader).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use existing request ID if provided', () => {
      mockRequest.headers = { 'x-request-id': 'existing-id' };

      requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.headers['x-request-id']).toBe('existing-id');
      expect(mockSetHeader).toHaveBeenCalledWith('X-Request-ID', 'existing-id');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove null bytes from strings', () => {
      mockRequest.body = { text: 'hello\0world' };

      sanitizeInput(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body.text).toBe('helloworld');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should remove control characters', () => {
      mockRequest.body = { text: 'hello\x00\x01\x02world' };

      sanitizeInput(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body.text).toBe('helloworld');
    });

    it('should preserve newlines and tabs', () => {
      mockRequest.body = { text: 'hello\n\tworld' };

      sanitizeInput(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body.text).toBe('hello\n\tworld');
    });

    it('should sanitize nested objects', () => {
      mockRequest.body = {
        outer: {
          inner: 'test\0value'
        }
      };

      sanitizeInput(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body.outer.inner).toBe('testvalue');
    });

    it('should sanitize arrays', () => {
      mockRequest.body = { items: ['item1\0', 'item2\0'] };

      sanitizeInput(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body.items).toEqual(['item1', 'item2']);
    });

    it('should prevent prototype pollution', () => {
      mockRequest.body = {
        '__proto__': { isAdmin: true },
        'constructor': { isAdmin: true },
        'prototype': { isAdmin: true },
        'validField': 'keep this'
      };

      sanitizeInput(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify prototype pollution keys are removed from own properties
      expect(Object.prototype.hasOwnProperty.call(mockRequest.body, '__proto__')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(mockRequest.body, 'constructor')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(mockRequest.body, 'prototype')).toBe(false);
      // Verify valid fields are preserved
      expect(mockRequest.body.validField).toBe('keep this');
    });

    it('should sanitize query parameters', () => {
      mockRequest.query = { search: 'test\0value' };

      sanitizeInput(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.query.search).toBe('testvalue');
    });
  });

  describe('validatePayloadSize', () => {
    it('should allow requests within size limit', () => {
      const validator = validatePayloadSize(1024); // 1MB
      mockRequest.headers = { 'content-length': '1000' };

      validator(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('should reject requests exceeding size limit', () => {
      const validator = validatePayloadSize(1); // 1KB
      mockRequest.headers = { 'content-length': '2000' }; // 2KB

      validator(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(413);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Payload too large',
        maxSize: '1KB'
      });
    });

    it('should allow requests with no content-length header', () => {
      const validator = validatePayloadSize(1024);
      mockRequest.headers = {};

      validator(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
