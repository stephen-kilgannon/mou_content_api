// src/utils/logger.ts

import { createLogger, format, transports } from 'winston';

// Configure the log format
const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
);

// Create the logger instance
const logger = createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        // Log to console
        new transports.Console(),
        // Log to a file
        new transports.File({ filename: 'logs/api.log' })
    ],
    exitOnError: false,
});

export default logger;
