import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/files/"); // Files will be stored in the "uploads/files" folder
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for various file types
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    console.log('File filter checking:', file.originalname, 'MIME type:', file.mimetype);
    
    const allowedTypes = [
        // Images
        'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/svg+xml',
        // Documents
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        // Archives
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
        // Code files
        'text/html', 'text/css', 'text/javascript', 'application/javascript',
        'text/typescript', 'application/typescript',
        // Design files
        'application/vnd.adobe.illustrator', 'application/vnd.adobe.photoshop',
        // Audio/Video
        'video/mp4', 'audio/mpeg', 'audio/mp3',
        // Fonts
        'font/ttf', 'font/otf', 'application/x-font-ttf', 'application/x-font-otf',
        // Additional common types
        'application/octet-stream', // Generic binary file
        'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        console.log('File type allowed:', file.mimetype);
        cb(null, true);
    } else {
        console.log('File type rejected:', file.mimetype);
        cb(new Error(`Invalid file type: ${file.mimetype}. Please upload a supported file format.`), false);
    }
};

const upload = multer({
    storage,
    limits: { 
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter
});

// Upload single file
export const uploadFile = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('Upload request received:', req.file);
        
        if (!req.file) {
            console.log('No file in request');
            return next(new ErrorHandler("No file uploaded", 400));
        }

        const fileUrl = `${process.env.SERVER_URI || 'https://appbackend.0xmintyn.com'}/uploads/files/${req.file.filename}`;
        
        console.log('File uploaded successfully:', {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            url: fileUrl
        });
        
        res.status(200).json({
            success: true,
            message: "File uploaded successfully",
            url: fileUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return next(new ErrorHandler(error.message, 400));
    }
});

// Upload multiple files
export const uploadMultipleFiles = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return next(new ErrorHandler("No files uploaded", 400));
        }

        const files = req.files as Express.Multer.File[];
        const fileUrls = files.map(file => ({
            url: `${process.env.SERVER_URI || 'https://appbackend.0xmintyn.com'}/uploads/files/${file.filename}`,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype
        }));
        
        res.status(200).json({
            success: true,
            message: "Files uploaded successfully",
            files: fileUrls
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Export multer middleware
export { upload };
