import { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import ErrorHandler from '../utils/errorHandler';
import path from 'path';
import ejs from 'ejs';
import sendEmail from '../utils/sendMail';
import { redis } from '../utils/redis';
import UserModel from '../models/user.mode';
import ProductModel from '../models/product.model';
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create order
export const createOrder = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.body;


     
        const user = await UserModel.findById(req.user?._id);

        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }

        // Check if already purchased
        const alreadyPurchased = user.purchasedProducts.some((item) => item.productId === productId);

        if (alreadyPurchased) {
            return next(new ErrorHandler('You already purchased this product', 400));
        }

        const product = await ProductModel.findById(productId);

        if (!product) {
            return next(new ErrorHandler('Product not found', 404));
        }

        // Save purchased product to user
        user.purchasedProducts.push({ productId: product._id.toString() });

        await user.save();

        // Optionally cache updated user in Redis
        // @ts-ignore 
        await redis.set(req.user?._id, JSON.stringify(user));

      

        res.status(200).json({
            success: true,
            message: 'Order created successfully',
            product,
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
