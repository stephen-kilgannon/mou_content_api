// src/index.ts

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import contentRoutes from './routes/content.routes';
import objectRoutes from './routes/object.routes';
import logger from './utils/logger';
import database from './utils/database';
import {
  helmetMiddleware,
  apiRateLimiter,
  writeRateLimiter,
  apiKeyAuth,
  requestIdMiddleware,
  requestLogger,
  sanitizeInput,
  corsOptions,
  errorHandler,
  notFoundHandler
} from './middleware/security';

dotenv.config();

const app = express();

// =============================================================================
// SECURITY MIDDLEWARE (Order matters!)
// =============================================================================

// Trust proxy for rate limiting behind reverse proxy (nginx)
app.set('trust proxy', 1);

// Request ID for tracing
app.use(requestIdMiddleware);

// Security headers
app.use(helmetMiddleware);

// CORS configuration
app.use(cors(corsOptions));

// Rate limiting
app.use(apiRateLimiter);

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Input sanitization (after body parsing)
app.use(sanitizeInput);

// Request logging
app.use(requestLogger);

// Morgan middleware for detailed HTTP logging
app.use(morgan('combined', { stream: { write: (message: string) => logger.info(message.trim()) } }));

// API Key authentication (optional - enabled when API_KEY env is set)
app.use(apiKeyAuth);

// =============================================================================
// HEALTH CHECK (before routes, no auth required)
// =============================================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'mou-service-content-api',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// =============================================================================
// DEVELOPMENT-ONLY DEBUG ENDPOINTS
// =============================================================================

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  // Debug endpoint to check current config (dev only)
  app.get('/dev/config', (req, res) => {
    res.status(200).json({
      environment: process.env.NODE_ENV,
      rateLimiting: 'disabled',
      apiKeyAuth: 'disabled',
      cors: 'all origins allowed',
      csp: 'disabled',
      hsts: 'disabled',
      port: process.env.PORT || 5000,
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'content_db',
      },
      hint: 'This endpoint is only available in development mode'
    });
  });

  // Echo endpoint for testing request/response (dev only)
  app.all('/dev/echo', (req, res) => {
    res.status(200).json({
      method: req.method,
      path: req.path,
      headers: req.headers,
      query: req.query,
      body: req.body,
      params: req.params,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  });

  logger.info('🛠️  Development mode: /dev/config and /dev/echo endpoints enabled');
  logger.info('🔓 Security relaxations: Rate limiting OFF, API key auth OFF, CORS open');
}

// =============================================================================
// API ROUTES
// =============================================================================

// Apply write rate limiter to mutation endpoints
app.use('/api/content', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return writeRateLimiter(req, res, next);
  }
  next();
}, contentRoutes);

app.use('/api/objects', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return writeRateLimiter(req, res, next);
  }
  next();
}, objectRoutes);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Database Connection and Server Start
const startServer = async () => {
  try {
    // Connect to PostgreSQL
    await database.connect();

    // Initialize database tables
    await database.initializeTables();

    // Start the server after successful DB connection
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  } catch (error) {
    logger.error(`Database connection error: ${error}`);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await database.close();
  process.exit(0);
});

startServer();
