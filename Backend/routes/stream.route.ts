import express, { Request, Response, NextFunction } from "express";
import fs, { statSync, createReadStream } from "fs";
import path from "path";
import ErrorHandler from "../utils/errorHandler";

const router = express.Router();

router.get("/:filename", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    const filePath = path.resolve("uploads/videos", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Video not found");
    }

    const stat = statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (!range) {
      return res.status(400).send("Requires Range header");
    }

    const chunkSize = 1 * 1024 * 1024; // 1MB chunk
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + chunkSize - 1, fileSize - 1);
    const contentLength = end - start + 1;

    const headers = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4"
    };

    res.writeHead(206, headers);

    const fileStream = createReadStream(filePath, { start, end });
    fileStream.pipe(res);
  } catch (error: any) {
    return next(new ErrorHandler(error.message || "Error streaming video", 500));
  }
});

export default router;