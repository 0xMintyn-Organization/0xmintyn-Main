import { Request, Response, NextFunction } from "express";
import EbookModel from "../models/ebook.model";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";

// Create an Ebook
export const createEbook = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { title, description, author, category, price, driveLink } = req.body;

    // @ts-ignore
    if (!req.file) {
        return next(new ErrorHandler("Cover image is required", 400));
    }
    // @ts-ignore
    const coverImage = `${process.env.SERVER_URL || "http://localhost:8000"}/uploads/${req.file.filename}`;

    const ebook = await EbookModel.create({
        title,
        description,
        author,
        category,
        price,
        driveLink,
        coverImage,
        createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, ebook });
});

// Get All Ebooks
export const getAllEbooks = CatchAsyncError(async (_req: Request, res: Response) => {
    const ebooks = await EbookModel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, ebooks });
});

// Get Ebook by ID
export const getEbookById = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const ebook = await EbookModel.findById(req.params.id);
    if (!ebook) return next(new ErrorHandler("Ebook not found", 404));
    res.status(200).json({ success: true, ebook });
});

// Update Ebook
export const updateEbook = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const ebook = await EbookModel.findById(req.params.id);
    if (!ebook) return next(new ErrorHandler("Ebook not found", 404));

    const updates = req.body;
    // @ts-ignore
    if (req.file) {
        // @ts-ignore
        updates.coverImage = `${process.env.SERVER_URL || "http://localhost:8000"}/uploads/${req.file.filename}`;
    }

    Object.assign(ebook, updates);
    await ebook.save();

    res.status(200).json({ success: true, ebook });
});

// Delete Ebook
export const deleteEbook = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const ebook = await EbookModel.findByIdAndDelete(req.params.id);
    if (!ebook) return next(new ErrorHandler("Ebook not found", 404));
    res.status(200).json({ success: true, message: "Ebook deleted" });
});
