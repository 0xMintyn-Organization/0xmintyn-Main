import multer from "multer";
import path from "path";
import fs from "fs";

// ✅ Ensure uploads/videos exists
const videoDir = path.join(__dirname, "../uploads/videos");
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

// ✅ Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, videoDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `video-${Date.now()}-${Math.floor(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const allowedTypes = ["video/mp4", "video/webm", "video/mov", "video/ogg"];
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only video files are allowed!"), false);
  }
};

const videoUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024 * 10 , // 10GB limit
  },
});

export default videoUpload;