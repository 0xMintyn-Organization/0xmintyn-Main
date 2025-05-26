import express from 'express';
import { createOrder, getAllOrders, newPayment, sendStripePublishableKey } from '../controllers/order.controller';
import { updateAccessToken } from '../controllers/user.controller';
import { authorizeRoles, isAthenticated, isAthenticated as isAuthenticated } from '../utils/auth';

const orderRouter = express.Router();


// Get all orders for a user (if needed, you can implement this in the controller)
orderRouter.get('/my_orders', updateAccessToken, isAuthenticated, getAllOrders);


orderRouter.post('/create-order', updateAccessToken, isAthenticated, createOrder);


orderRouter.get('/payment/stripepublishablekey', sendStripePublishableKey);

orderRouter.post('/payment', isAthenticated, newPayment);



export default orderRouter;
