import express from 'express';
import {
  createContent,
  getAllContent,
  getContentById,
  getContentBySlug
} from '../controllers/content.controller';

const router = express.Router();

router.post('/', createContent);
router.get('/', getAllContent);
router.get('/:id', getContentById);
router.get('/slug/:slug', getContentBySlug);





export default router;
