import mongoose, { Schema, Document, Types } from "mongoose";

// Review Subdocument
const reviewSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true },
  comment: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
  // _id automatically included
});

// Video Resource Link
const linkSchema = new Schema({
  title: { type: String, required: true },
  url: { type: String, required: true }
});

// Course Video Subdocument
const videoSchema = new Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  videoLength: { type: Number, required: true },
  description: { type: String },
  links: [linkSchema]
});

// Course Section Subdocument
const sectionSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoSection: { type: String },
  videos: [videoSchema]
});

// Main Course Schema
const courseSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  categories: { type: String },
  level: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced", "All Levels"]
  },
  price: { type: Number, required: true },
  estimatedPrice: { type: Number, required: true },
  tags: [String],
  benefits: [String],
  prerequisites: [String],
  thumbnail: { type: String, required: true }, // URL string
  demoUrl: { type: String, required: true },   // URL string
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  courseData: [sectionSchema],               // Sections (which include videos internally)
  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 }
}, {
  timestamps: true
});

export const CourseModel = mongoose.model("Course", courseSchema);