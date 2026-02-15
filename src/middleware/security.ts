// src/middleware/security.ts
// Security middleware for production hardening with DevEx in development

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

// =============================================================================
// ENVIRONMENT HELPERS
// =============================================================================

const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';

// =============================================================================
// HELMET CONFIGURATION
// =============================================================================

// Development: Relaxed CSP for debugging tools, hot reload, etc.
// Production: Strict security headers
export const helmetMiddleware = helmet({
  // Content Security Policy - relaxed in dev for debugging
  contentSecurityPolicy: isDev ? false : {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  // Hide X-Powered-By header
  hidePoweredBy: true,
  // HTTP Strict Transport Security - disabled in dev (no HTTPS)
  hsts: isDev ? false : {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  // Prevent IE from executing downloads in site's context
  ieNoOpen: true,
  // Don't sniff MIME types
  noSniff: true,
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // XSS Filter
  xssFilter: true,
});

// =============================================================================
// RATE LIMITING
// =============================================================================

// General API rate limiter
// Development: Disabled for rapid iteration
// Production: 100 requests per 15 minutes
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 0 : 100, // 0 = unlimited in development
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      retryAfter: '15 minutes',
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks and in development
    return req.path === '/health' || isDev;
  },
});

// Stricter rate limiter for write operations
// Development: Disabled for rapid testing
// Production: 20 write requests per minute
export const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDev ? 0 : 20, // 0 = unlimited in development
  message: {
    error: 'Too many write requests, please slow down.',
    retryAfter: '1 minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev, // Skip entirely in development
  handler: (req: Request, res: Response) => {
    logger.warn(`Write rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(429).json({
      error: 'Too many write requests, please slow down.',
      retryAfter: '1 minute',
    });
  },
});

// Auth attempt rate limiter (for future auth endpoints)
// Development: Disabled for testing
// Production: 5 attempts per 15 minutes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 0 : 5, // 0 = unlimited in development
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev, // Skip entirely in development
});

// =============================================================================
// API KEY AUTHENTICATION
// =============================================================================

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  // Skip auth for health checks
  if (req.path === '/health') {
    return next();
  }

  // Skip auth in development/test if no API key is set
  const apiKey = process.env.API_KEY;
  if (!apiKey || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return next();
  }

  const providedKey = req.headers['x-api-key'] || req.query.api_key;

  if (!providedKey) {
    logger.warn(`Missing API key from IP: ${req.ip}`);
    return res.status(401).json({ error: 'API key required' });
  }

  if (providedKey !== apiKey) {
    logger.warn(`Invalid API key attempt from IP: ${req.ip}`);
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
};

// =============================================================================
// REQUEST ID MIDDLEWARE
// =============================================================================

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

// =============================================================================
// REQUEST LOGGING MIDDLEWARE
// =============================================================================

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'];

  // Log request
  logger.info(`[${requestId}] ${req.method} ${req.path} - Started`);

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    logger[logLevel](`[${requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};

// =============================================================================
// INPUT SANITIZATION
// =============================================================================

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Recursively sanitize object
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove null bytes and control characters (except newlines and tabs)
      return obj.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key of Object.keys(obj)) {
        // Sanitize keys too (prevent prototype pollution)
        const safeKey = key.replace(/[^\w\s-_.]/g, '');
        if (safeKey && !['__proto__', 'constructor', 'prototype'].includes(safeKey)) {
          sanitized[safeKey] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

// =============================================================================
// PAYLOAD SIZE VALIDATION
// =============================================================================

export const validatePayloadSize = (maxSizeKB: number = 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxSize = maxSizeKB * 1024;

    if (contentLength > maxSize) {
      logger.warn(`Payload too large from IP: ${req.ip}, size: ${contentLength}`);
      return res.status(413).json({
        error: 'Payload too large',
        maxSize: `${maxSizeKB}KB`,
      });
    }

    next();
  };
};

// =============================================================================
// CORS CONFIGURATION
// =============================================================================

// Development: Allow all origins for local testing (localhost:3000, etc.)
// Production: Respect ALLOWED_ORIGINS environment variable
export const corsOptions = isDev
  ? {
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  }
  : {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

      // Allow requests with no origin (mobile apps, curl, etc)
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400, // 24 hours
  };

// =============================================================================
// ERROR HANDLER
// =============================================================================

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'];

  logger.error(`[${requestId}] Unhandled error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: 'Internal server error',
      requestId,
    });
  }

  // In development, include error details
  res.status(500).json({
    error: err.message,
    stack: err.stack,
    requestId,
  });
};

// =============================================================================
// 404 HANDLER
// =============================================================================

export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
  });
};
