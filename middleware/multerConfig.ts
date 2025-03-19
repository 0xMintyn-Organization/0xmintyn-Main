import multer from "multer";
import path from "path";

// Set storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Files will be stored in the "uploads" folder
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
});

// File filter to allow only specific file types
// @ts-ignore
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only JPEG, PNG, and JPG are allowed."), false);
    }
};

// Multer configuration
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter
});

export default upload;
