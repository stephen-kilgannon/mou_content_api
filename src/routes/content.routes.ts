import express from 'express';
import {
  createContent,
  getAllContent,
  getContentById,
} from '../controllers/content.controller';

const router = express.Router();

router.post('/', createContent);
router.get('/', getAllContent);
router.get('/:id', getContentById);

export default router;
