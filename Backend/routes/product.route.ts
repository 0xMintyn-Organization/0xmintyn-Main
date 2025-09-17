import express from 'express';
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    getAllProductsByUser,
    deleteProduct,
    getAllProductsByPagination
} from '../controllers/product.controller';
import upload from '../middleware/multerConfig';
import { updateAccessToken } from '../controllers/user.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';

const productRouter = express.Router();

productRouter.post('/create', updateAccessToken, isAuthenticated, upload.single('coverImage'), createProduct);
productRouter.get('/all', getAllProducts);
productRouter.get('/all/pagination', getAllProductsByPagination);
productRouter.get('/all/user', updateAccessToken, isAuthenticated, getAllProductsByUser);
productRouter.get('/:id', getProductById);
productRouter.put('/:id', updateAccessToken, isAuthenticated, upload.single('coverImage'), updateProduct);

productRouter.delete('/:id', updateAccessToken, isAuthenticated, deleteProduct);

export default productRouter;
