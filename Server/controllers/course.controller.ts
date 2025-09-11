import { Request, Response, NextFunction } from "express";
import { CourseModel } from "../models/course.model";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";

// Create a new course (Instructor)
export const createCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const {
    name,
    description,
    categories,
    level,
    price,
    estimatedPrice,
    tags,
    benefits,
    prerequisites,
    demoUrl,
    courseData,
  } = req.body;

  const createdBy = req.user?._id;

  // Check required body fields
  if (!name || !price || !demoUrl || !courseData) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  // Check file
  if (!req.file) {
    return next(new ErrorHandler("Please upload a course thumbnail image", 400));
  }

  const serverUrl = process.env.SERVER_URL || "http://localhost:8000";
  const thumbnail = `${serverUrl}/uploads/${req.file.filename}`;

  // Parse JSON body fields for arrays
  const parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
  const parsedBenefits = typeof benefits === "string" ? JSON.parse(benefits) : benefits;
  const parsedPrerequisites = typeof prerequisites === "string" ? JSON.parse(prerequisites) : prerequisites;
  const parsedCourseData = typeof courseData === "string" ? JSON.parse(courseData) : courseData;

  const course = await CourseModel.create({
    name,
    description,
    categories,
    level,
    price,
    estimatedPrice,
    tags: parsedTags,
    benefits: parsedBenefits,
    prerequisites: parsedPrerequisites,
    thumbnail,
    demoUrl,
    courseData: parsedCourseData,
    createdBy,
  });

  res.status(201).json({
    success: true,
    message: "Course created successfully",
    course,
  });
});


// Get all courses (public)
export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const courses = await CourseModel.find()
      .sort({ createdAt: -1 })
      .select(
        "name description thumbnail categories level price estimatedPrice averageRating totalReviews createdBy"
      )
      .populate("createdBy", "username avatar");

    // Transform to match frontend expectations
    const formattedCourses = courses.map((course) => ({
      id: course._id,
      title: course.name,
      description: course.description,
      imagePath: course.thumbnail,
      imageAltText: `${course.name} course image`,  // Optional
      category: course.categories,
      price: course.price,
      originalPrice: course.estimatedPrice,
      rating: course.averageRating,
      students: course.totalReviews, // or actual enrollment if stored
      level: course.level,
      instructor: course.createdBy?.username || "Unknown Instructor",
      authorAvatar: course.createdBy?.avatar || null,
      duration: "5 hours", // You can replace this with dynamic value if you store real durations
    }));

    res.status(200).json({
      success: true,
      message: "Courses preview fetched successfully",
      courses: formattedCourses,
    });
  }
);

export const getCourseById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const courseId = req.params.id;
    const course = await CourseModel.findById(courseId).populate("createdBy");

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }
    res.status(200).json({
      success: true,
      message: "Course details fetched successfully",
      course,
    });
  }
);





