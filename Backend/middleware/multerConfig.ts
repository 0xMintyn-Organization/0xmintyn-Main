import multer from "multer";
import path from "path";
import fs from "fs";

// Set storage engine with absolute paths
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Store images in uploads/images/ and other files in uploads/files/
        const destDir = file.fieldname === 'images' 
            ? path.join(__dirname, "../uploads/images")
            : path.join(__dirname, "../uploads/files");
        
        // Ensure directory exists
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        cb(null, destDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to allow only specific file types
// @ts-ignore
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    const allowedTypes = [
        // Images
        "image/jpeg", "image/png", "image/jpg", "image/gif", "image/svg+xml",
        // Documents
        "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        // Archives
        "application/zip", "application/x-rar-compressed", "application/x-7z-compressed",
        // Code files
        "text/html", "text/css", "text/javascript", "application/javascript",
        "text/typescript", "application/typescript",
        // Design files
        "application/vnd.adobe.illustrator", "application/vnd.adobe.photoshop",
        // Audio/Video
        "video/mp4", "audio/mpeg", "audio/mp3",
        // Fonts
        "font/ttf", "font/otf", "application/x-font-ttf", "application/x-font-otf"
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Please upload a supported file format."), false);
    }
};

// Multer configuration
const upload = multer({
    storage,
    limits: { fileSize: 1000 * 1024 * 1024 }, // Limit file size to 100MB
    fileFilter
});

export default upload;
