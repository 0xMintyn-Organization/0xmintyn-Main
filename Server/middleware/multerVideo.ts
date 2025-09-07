import multer from "multer";
import path from "path";
import fs from "fs";
import type { File as MulterFile } from "multer";


// Accept files like .mp4, .webm
const allowedTypes = ["video/mp4", "video/webm", "video/mkv"];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { courseId } = req.body;

    const dir = `uploads/videos/${courseId}`;
    fs.mkdirSync(dir, { recursive: true });

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  }
});


const fileFilter = (req: any, file: MulterFile, cb: any) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only video files are allowed (.mp4, .webm, .mkv)"));
  }
};

const uploadVideo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024  // 10 GB limit
  }
});

export default uploadVideo;