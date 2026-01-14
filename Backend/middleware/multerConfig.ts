import multer from "multer";

// Use memory storage - files will be uploaded to Cloudinary
// This prevents disk storage and allows direct Cloudinary upload
const storage = multer.memoryStorage();

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
