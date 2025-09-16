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

  const serverUrl = process.env.SERVER_URL || "https://appbackend.0xmintyn.com";
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

// course single details (public)
export const getCourseById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const courseId = req.params.id;

    const course = await CourseModel.findById(courseId).populate("createdBy");

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    // Safe clone
    const courseObj = course.toObject();

    // Remove 'videoUrl', 'links', 'suggestion', 'questions' from courseData.videos
    if (Array.isArray(courseObj.courseData)) {
      courseObj.courseData = courseObj.courseData.map((section: any) => ({
        ...section,
        videos: section.videos?.map((video: any) => {
          const {
            videoUrl, // ❌ remove
            links,    // ❌ remove
            suggestion, // ❌ if present
            questions,  // ❌ if present
            ...rest
          } = video;
          return rest;
        })
      }));
    }

    res.status(200).json({
      success: true,
      message: "Course details fetched successfully",
      course: courseObj,
    });
  }
);


// single get course purchased (private for enrolled users)
export const getPurchasedCourseById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const courseId = req.params.id;
    const userId = req.user?._id;

    const course = await CourseModel.findById(courseId).populate("createdBy");
    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Purchased course details fetched successfully",
      course,
    });
  } 
);

// Update course (Instructor)
export const updateCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const courseId = req.params.id;
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
      courseData,
    } = req.body;

    const course = await CourseModel.findById(courseId);
    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    // Check if user owns the course
    if (course.createdBy.toString() !== req.user?._id.toString()) {
      return next(new ErrorHandler("You are not authorized to update this course", 403));
    }

    // Parse JSON fields if they are strings
    const parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
    const parsedBenefits = typeof benefits === "string" ? JSON.parse(benefits) : benefits;
    const parsedPrerequisites = typeof prerequisites === "string" ? JSON.parse(prerequisites) : prerequisites;
    const parsedCourseData = typeof courseData === "string" ? JSON.parse(courseData) : courseData;

    // Update fields
    if (name) course.name = name;
    if (description) course.description = description;
    if (categories) course.categories = categories;
    if (level) course.level = level;
    if (price) course.price = price;
    if (estimatedPrice) course.estimatedPrice = estimatedPrice;
    if (parsedTags) course.tags = parsedTags;
    if (parsedBenefits) course.benefits = parsedBenefits;
    if (parsedPrerequisites) course.prerequisites = parsedPrerequisites;
    if (parsedCourseData) course.courseData = parsedCourseData;

    // Handle thumbnail update if provided
    if (req.file) {
      const serverUrl = process.env.SERVER_URL || "https://appbackend.0xmintyn.com";
      course.thumbnail = `${serverUrl}/uploads/${req.file.filename}`;
    }

    await course.save();

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  }
);

// Delete course (Instructor)
export const deleteCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const courseId = req.params.id;

    const course = await CourseModel.findById(courseId);
    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    // Check if user owns the course
    if (course.createdBy.toString() !== req.user?._id.toString()) {
      return next(new ErrorHandler("You are not authorized to delete this course", 403));
    }

    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  }
);

// Get instructor's courses
export const getInstructorCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const instructorId = req.user?._id;

    const courses = await CourseModel.find({ createdBy: instructorId })
      .sort({ createdAt: -1 })
      .populate("createdBy", "username avatar");

    res.status(200).json({
      success: true,
      message: "Instructor courses fetched successfully",
      courses,
    });
  }
);



