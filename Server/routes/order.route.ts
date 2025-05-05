import express from 'express';
import { createOrder, getAllOrders } from '../controllers/order.controller';
import { updateAccessToken } from '../controllers/user.controller';
import { isAthenticated as isAuthenticated } from '../utils/auth';

const orderRouter = express.Router();

// Create a new order
orderRouter.post('/create', updateAccessToken, isAuthenticated, createOrder);

// Get all orders for a user (if needed, you can implement this in the controller)
orderRouter.get('/my_orders', updateAccessToken, isAuthenticated, getAllOrders);


export default orderRouter;
