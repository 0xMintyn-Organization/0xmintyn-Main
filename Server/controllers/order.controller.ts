import { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import ErrorHandler from '../utils/errorHandler';
import path from 'path';
import ejs from 'ejs';
import sendEmail from '../utils/sendMail';
import { redis } from '../utils/redis';
import UserModel from '../models/user.mode';
import ProductModel from '../models/product.model';
import OrderModel from '../models/order.model';
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create order
export const createOrder = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId, payment_info } = req.body;

        if (payment_info) {
            if ('id' in payment_info) {
                const paymentIntentId = payment_info.id;
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

                if (paymentIntent.status !== 'succeeded') {
                    return next(new ErrorHandler('Payment not successful', 400));
                }
            }
        }

        const user = await UserModel.findById(req.user?._id);

        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }

        const alreadyPurchased = user.purchasedProducts.some((item) => item.productId === productId);
        if (alreadyPurchased) {
            return next(new ErrorHandler('You already purchased this product', 400));
        }

        const product  = await ProductModel.findById(productId) as any;
        if (!product) {
            return next(new ErrorHandler('Product not found', 404));
        }

        user.purchasedProducts.push({ productId: product._id.toString() });
        await user.save();


        // @ts-ignore        product.purchasedBy.push({ userId: user._id.toString() });
        await redis.set(req.user?._id, JSON.stringify(user));


        const order = await OrderModel.create({
            productId: product._id.toString(),
            userId: user._id.toString(),
            payment_info: payment_info || {}
        });

        const mailData = {
            order: {
                _id: product._id.toString().slice(0, 6),
                name: product.name,
                price: product.price,
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            }
        };

        // try {
        //     if (user) {
        //         await sendEmail({
        //             email: user.email,
        //             subject: 'Product Order Confirmation',
        //             template: 'order-confirmation.ejs',
        //             data: mailData
        //         });
        //     }
        // } catch (error: any) {
        //     return next(new ErrorHandler(error.message, 500));
        // }

        res.status(200).json({
            success: true,
            message: 'Order created successfully',
            product
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});



export const getAllOrders = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    // Get the logged-in user
    const user = await UserModel.findById(req.user?._id);

    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    const purchasedProductIds = user.purchasedProducts.map((item) => item.productId);

    if (!purchasedProductIds.length) {
        return res.status(200).json({
            success: true,
            products: [],
            productsCount: 0,
            currentPage: page,
            totalPages: 0,
        });
    }

    // Fetch the purchased products with pagination
    const products = await ProductModel.find({ _id: { $in: purchasedProductIds } })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'firstName lastName email avatar');

    const totalProducts = purchasedProductIds.length;

    res.status(200).json({
        success: true,
        products,
        productsCount: totalProducts,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
    });
});


// Send Stripe Publishable Key
export const sendStripePublishableKey = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        pulishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    })
});

// new Payment 
export const newPayment = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payment = await stripe.paymentIntents.create({
            amount: req.body.amount,
            currency: 'USD',
            metadata: {
                company: 'Raja Academy'
            },
            automatic_payment_methods: {
                enabled: true
            },

        });

        res.status(201).json({
            success: true,
            client_secret: payment.client_secret
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});
