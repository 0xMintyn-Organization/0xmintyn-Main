import mongoose, { Schema, Document } from "mongoose";

export interface IBookmark extends Document {
  userId: string;
  courseId: string;
  courseName: string;
  courseDescription: string;
  courseThumbnail: string;
  instructorName: string;
  coursePrice: number;
  courseCategory: string;
  courseLevel: string;
  courseDuration: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookmarkSchema = new Schema<IBookmark>({
  userId: {
    type: String,
    required: true,
  },
  courseId: {
    type: String,
    required: true,
  },
  courseName: {
    type: String,
    required: true,
  },
  courseDescription: {
    type: String,
    required: true,
  },
  courseThumbnail: {
    type: String,
    required: false,
    default: "https://via.placeholder.com/300x200?text=No+Image",
  },
  instructorName: {
    type: String,
    required: true,
  },
  coursePrice: {
    type: Number,
    required: false,
    default: 0,
  },
  courseCategory: {
    type: String,
    required: false,
    default: "General",
  },
  courseLevel: {
    type: String,
    required: false,
    default: "Beginner",
  },
  courseDuration: {
    type: String,
    required: false,
    default: "0 hours",
  },
}, {
  timestamps: true,
});

// Create compound index to prevent duplicate bookmarks
bookmarkSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const BookmarkModel = mongoose.model<IBookmark>("Bookmark", bookmarkSchema);
