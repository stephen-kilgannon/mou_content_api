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
import { validate } from '../middleware/validation';
import {
    createObjectValidation,
    updateObjectValidation,
    getObjectByIdValidation,
    getObjectsQueryValidation,
    voteValidation,
    updateItemValidation
} from '../middleware/validation';

const router = express.Router();

// CRUD operations
router.post('/', validate(createObjectValidation), createObject);
router.get('/', validate(getObjectsQueryValidation), getAllObjects);
router.get('/:id', validate(getObjectByIdValidation), getObjectById);
router.put('/:id', validate(updateObjectValidation), updateObject);
router.delete('/:id', validate(getObjectByIdValidation), deleteObject);
router.delete('/', cleanObjects);

// Voting operations
router.patch('/:id/vote', validate(voteValidation), updateObjectVotes);

// Item operations
router.patch('/:id/items/:itemIndex', validate(updateItemValidation), updateObjectItem);

export default router;