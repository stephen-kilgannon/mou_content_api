import express from 'express';
import {
    createObject,
    getAllObjects,
    getObjectById,
    updateObject,
    deleteObject,
    updateObjectVotes,
    updateObjectItem,
    cleanObjects
} from '../controllers/object.controller';

const router = express.Router();

// CRUD operations
router.post('/', createObject);
router.get('/', getAllObjects);
router.get('/:id', getObjectById);
router.put('/:id', updateObject);
router.delete('/:id', deleteObject);
router.delete('/', cleanObjects);

// Voting operations
router.patch('/:id/vote', updateObjectVotes);

// Item operations
router.patch('/:id/items/:itemIndex', updateObjectItem);

export default router;