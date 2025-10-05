import express from 'express';
import {
  createContent,
  getAllContent,
  getContentById,
  getContentBySlug,
  deleteContent,
  cleanContent
} from '../controllers/content.controller';

const router = express.Router();

router.post('/', createContent);
router.get('/', getAllContent);
router.get('/:id', getContentById);
router.get('/slug/:slug', getContentBySlug);
router.delete('/:id', deleteContent)
router.delete('/', cleanContent)





export default router;
