import express from "express";
import videoUpload from "../middleware/multerVideo";
import path from "path";

const router = express.Router();

import { Request } from "express";
import type { File as MulterFile } from "multer";

interface MulterRequest extends Request {
  file?: MulterFile;
}

router.post("/upload", videoUpload.single("file"), async (req, res) => {
  const multerReq = req as MulterRequest;
  if (!multerReq.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const baseUrl = process.env.SERVER_URL || "http://localhost:8000";
  const fileUrl = `${baseUrl}/uploads/videos/${multerReq.file.filename}`;

  return res.status(200).json({
    success: true,
    url: fileUrl,
  });
});

export default router;