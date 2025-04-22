import express from 'express';
import {
    createEbook,
    getAllEbooks,
    getEbookById,
    updateEbook,
    deleteEbook
} from '../controllers/ebook.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';
import upload from '../middleware/multerConfig';

const ebookRouter = express.Router();

ebookRouter.post('/create', isAuthenticated, upload.single('coverImage'), createEbook);

ebookRouter.get('/all', getAllEbooks);

ebookRouter.get('/:id', getEbookById);

ebookRouter.put('/:id', isAuthenticated, upload.single('coverImage'), updateEbook);

ebookRouter.delete('/:id', isAuthenticated, deleteEbook);

export default ebookRouter;
