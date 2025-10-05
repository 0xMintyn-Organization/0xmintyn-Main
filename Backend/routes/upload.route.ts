import express from "express";
import { uploadFile, uploadMultipleFiles, upload } from "../controllers/upload.controller";
import { updateAccessTokenMiddleware } from "../controllers/user.controller";
import { isAthenticated } from "../utils/auth";

const uploadRouter = express.Router();

// Single file upload
uploadRouter.post(
    "/file",
    updateAccessTokenMiddleware,
    isAthenticated,
    (req, res, next) => {
        upload.single('file')(req, res, (err) => {
            if (err) {
                console.error('Multer error:', err);
                return res.status(400).json({
                    success: false,
                    message: err.message || 'File upload error'
                });
            }
            next();
        });
    },
    uploadFile
);

// Multiple files upload
uploadRouter.post(
    "/files",
    updateAccessTokenMiddleware,
    isAthenticated,
    upload.array('files', 10), // Max 10 files
    uploadMultipleFiles
);

export default uploadRouter;