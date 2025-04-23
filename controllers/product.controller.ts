import { Request, Response, NextFunction } from "express";
import ProductModel from "../models/product.model";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";

// Create a Product
export const createProduct = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { title, description, amount, currency, type } = req.body;
    // @ts-ignore 
    if (!req.file) {
        return next(new ErrorHandler("Cover image is required", 400));
    }

    if (!["Service", "Product"].includes(type)) {
        return next(new ErrorHandler("Invalid type. Must be either 'Service' or 'Product'.", 400));
    }

    // @ts-ignore 
    const coverImage = `${process.env.SERVER_URL || "http://localhost:8000"}/uploads/${req.file.filename}`;

    const product = await ProductModel.create({
        title,
        description,
        amount,
        currency,
        coverImage,
        type,
        createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, product });
});

// Get All Products
export const getAllProducts = CatchAsyncError(async (_req: Request, res: Response) => {
    const products = await ProductModel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, products });
});

export const getAllProductsByUser = CatchAsyncError(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const products = await ProductModel.find({ createdBy: userId }).sort({ createdAt: -1 });

    if (!products.length) {
        return res.status(404).json({ success: false, message: "No products found for this user" });
    }

    res.status(200).json({ success: true, products });
});

// Get Product by ID
export const getProductById = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return next(new ErrorHandler("Product not found", 404));
    res.status(200).json({ success: true, product });
});

// Update Product
export const updateProduct = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return next(new ErrorHandler("Product not found", 404));

    if (product.createdBy.toString() !== req.user?._id.toString()) {
        return next(new ErrorHandler("You are not authorized to update this product", 403));
    }

    const updates = req.body;

    if (updates.type && !["Service", "Product"].includes(updates.type)) {
        return next(new ErrorHandler("Invalid type. Must be either 'Service' or 'Product'.", 400));
    }
    // @ts-ignore 
    if (req.file) {
        // @ts-ignore 
        updates.coverImage = `${process.env.SERVER_URL || "http://localhost:8000"}/uploads/${req.file.filename}`;
    }

    Object.assign(product, updates);
    await product.save();

    res.status(200).json({ success: true, product });
});


// Delete Product
export const deleteProduct = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return next(new ErrorHandler("Product not found", 404));

    if (product.createdBy.toString() !== req.user?._id.toString()) {
        return next(new ErrorHandler("You are not authorized to delete this product", 403));
    }

    await product.deleteOne(); // ✅ Correct method
    res.status(200).json({ success: true, message: "Product deleted successfully" });
});
