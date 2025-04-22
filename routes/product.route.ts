import express from 'express';
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
} from '../controllers/product.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';
import upload from '../middleware/multerConfig';

const productRouter = express.Router();

productRouter.post('/create', isAuthenticated, upload.single('image'), createProduct);

productRouter.get('/all', getAllProducts);

productRouter.get('/:id', getProductById);

productRouter.put('/:id', isAuthenticated, upload.single('image'), updateProduct);

productRouter.delete('/:id', isAuthenticated, deleteProduct);

export default productRouter;
