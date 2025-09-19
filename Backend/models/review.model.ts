import mongoose, { Document, Schema } from "mongoose";

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  rating: number; // 1-5 stars
  comment: string;
  userName: string;
  userAvatar?: string;
  isVerified: boolean; // true if user actually purchased the course
  helpful: number; // number of helpful votes
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema: Schema<IReview> = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  userName: {
    type: String,
    required: true,
  },
  userAvatar: {
    type: String,
    required: false,
  },
  isVerified: {
    type: Boolean,
    default: true, // We'll verify this when creating the review
  },
  helpful: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Create compound index to prevent duplicate reviews from same user for same course
reviewSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Create index for efficient querying
reviewSchema.index({ courseId: 1, createdAt: -1 });

const ReviewModel = mongoose.model<IReview>("Review", reviewSchema);

export default ReviewModel;
