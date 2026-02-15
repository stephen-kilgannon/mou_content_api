import express from 'express';
import {
  createContent,
  getAllContent,
  getContentById,
  getContentBySlug,
  deleteContent,
  cleanContent
} from '../controllers/content.controller';
import { validate } from '../middleware/validation';
import {
  createContentValidation,
  getContentByIdValidation,
  getContentBySlugValidation
} from '../middleware/validation';

const router = express.Router();

router.post('/', validate(createContentValidation), createContent);
router.get('/', getAllContent);
router.get('/:id', validate(getContentByIdValidation), getContentById);
router.get('/slug/:slug', validate(getContentBySlugValidation), getContentBySlug);
router.delete('/:id', validate(getContentByIdValidation), deleteContent);
router.delete('/', cleanContent);

export default router;
