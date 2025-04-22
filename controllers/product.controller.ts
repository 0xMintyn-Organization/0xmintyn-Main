import { Request, Response, NextFunction } from "express";
import ProductModel from "../models/product.model";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";

// Create Product
export const createProduct = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { name, description, price } = req.body;
    // @ts-ignore 
    if (!req.file) {
        return next(new ErrorHandler("Image is required", 400));
    }
    // @ts-ignore 
    const image = `${process.env.SERVER_URL || "http://localhost:8000"}/uploads/${req.file.filename}`;

    const product = await ProductModel.create({
        name,
        description,
        price,
        image,
        createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, product });
});

// Get All Products
export const getAllProducts = CatchAsyncError(async (_req: Request, res: Response) => {
    const products = await ProductModel.find().sort({ createdAt: -1 });
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

    const updates = req.body;
    // @ts-ignore 

    if (req.file) {
        // @ts-ignore 
        updates.image = `${process.env.SERVER_URL || "http://localhost:8000"}/uploads/${req.file.filename}`;
    }

    Object.assign(product, updates);
    await product.save();

    res.status(200).json({ success: true, product });
});

// Delete Product
export const deleteProduct = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const product = await ProductModel.findByIdAndDelete(req.params.id);
    if (!product) return next(new ErrorHandler("Product not found", 404));
    res.status(200).json({ success: true, message: "Product deleted" });
});
