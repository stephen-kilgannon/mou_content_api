// src/middleware/validation.ts
// Input validation middleware using express-validator

import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// =============================================================================
// VALIDATION HANDLER
// =============================================================================

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map(err => ({
      field: (err as any).path || 'unknown',
      message: err.msg,
      value: (err as any).value
    }));

    logger.warn(`Validation failed: ${JSON.stringify(extractedErrors)}`);

    return res.status(400).json({
      error: 'Validation failed',
      details: extractedErrors
    });
  };
};

// =============================================================================
// CONTENT VALIDATORS
// =============================================================================

export const createContentValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 255 }).withMessage('Title must be at most 255 characters')
    .escape(),

  body('content')
    .notEmpty().withMessage('Content is required')
    .isLength({ max: 1000000 }).withMessage('Content must be at most 1MB'),

  body('meta')
    .optional()
    .isObject().withMessage('Meta must be an object'),

  body('meta.description')
    .optional()
    .isString().withMessage('Meta description must be a string')
    .isLength({ max: 500 }).withMessage('Meta description must be at most 500 characters'),

  body('meta.keywords')
    .optional()
    .isArray().withMessage('Meta keywords must be an array'),

  body('meta.keywords.*')
    .optional()
    .isString().withMessage('Each keyword must be a string')
    .isLength({ max: 50 }).withMessage('Each keyword must be at most 50 characters'),

  body('slug')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Slug must be at most 255 characters')
    .matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens')
];

export const getContentByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a positive integer')
];

export const getContentBySlugValidation = [
  param('slug')
    .trim()
    .notEmpty().withMessage('Slug is required')
    .isLength({ max: 255 }).withMessage('Slug must be at most 255 characters')
];

// =============================================================================
// OBJECT VALIDATORS
// =============================================================================

export const createObjectValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 255 }).withMessage('Title must be at most 255 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 10000 }).withMessage('Description must be at most 10000 characters'),

  body('userId')
    .optional({ nullable: true })
    .isString().withMessage('User ID must be a string')
    .isLength({ max: 255 }).withMessage('User ID must be at most 255 characters'),

  body('dueDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Due date must be a valid ISO 8601 date'),

  body('type')
    .optional()
    .isString().withMessage('Type must be a string')
    .isLength({ max: 100 }).withMessage('Type must be at most 100 characters'),

  body('metadata')
    .optional()
    .isObject().withMessage('Metadata must be an object'),

  body('items')
    .optional()
    .isArray().withMessage('Items must be an array'),

  body('items.*.type')
    .optional()
    .isIn(['task', 'journal', 'event']).withMessage('Item type must be task, journal, or event'),

  body('items.*.title')
    .optional()
    .isString().withMessage('Item title must be a string')
    .isLength({ max: 255 }).withMessage('Item title must be at most 255 characters'),

  body('items.*.status')
    .optional()
    .isIn(['pending', 'completed', 'in-progress']).withMessage('Item status must be pending, completed, or in-progress'),

  body('upvotes')
    .optional()
    .isInt({ min: 0 }).withMessage('Upvotes must be a non-negative integer'),

  body('downvotes')
    .optional()
    .isInt({ min: 0 }).withMessage('Downvotes must be a non-negative integer')
];

export const updateObjectValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a positive integer'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Title must be at most 255 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 10000 }).withMessage('Description must be at most 10000 characters'),

  body('type')
    .optional()
    .isString().withMessage('Type must be a string')
    .isLength({ max: 100 }).withMessage('Type must be at most 100 characters')
];

export const getObjectByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a positive integer')
];

export const getObjectsQueryValidation = [
  query('type')
    .optional()
    .isString().withMessage('Type must be a string')
    .isLength({ max: 100 }).withMessage('Type must be at most 100 characters'),

  query('userId')
    .optional()
    .isString().withMessage('User ID must be a string'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  query('offset')
    .optional()
    .isInt({ min: 0 }).withMessage('Offset must be a non-negative integer')
];

export const voteValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a positive integer'),

  body('type')
    .notEmpty().withMessage('Vote type is required')
    .isIn(['upvote', 'downvote']).withMessage('Vote type must be upvote or downvote')
];

export const updateItemValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID must be a positive integer'),

  param('itemIndex')
    .isInt({ min: 0 }).withMessage('Item index must be a non-negative integer'),

  body('status')
    .optional()
    .isIn(['pending', 'completed', 'in-progress']).withMessage('Status must be pending, completed, or in-progress'),

  body('completed')
    .optional()
    .isBoolean().withMessage('Completed must be a boolean')
];
