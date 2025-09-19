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

// Temporary API to create a professional course (for testing)
export const createTempProfessionalCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // Professional course data with enhanced details
    const professionalCourseData = {
      name: "Testing Course 1",
      description: `Master the art of data science with this comprehensive course designed for both beginners and intermediate learners. 

This course covers everything you need to know to become a proficient data scientist, including:

🔍 **Data Analysis Fundamentals**
- Statistical analysis and probability theory
- Data visualization techniques with Python and R
- Exploratory data analysis (EDA) best practices

🤖 **Machine Learning Mastery**
- Supervised and unsupervised learning algorithms
- Deep learning with TensorFlow and PyTorch
- Model evaluation and optimization techniques

📊 **Real-World Applications**
- Business intelligence and analytics
- Predictive modeling for various industries
- Data-driven decision making strategies

🛠️ **Tools & Technologies**
- Python programming for data science
- SQL for database management
- Jupyter notebooks and data science workflows
- Cloud platforms (AWS, Google Cloud, Azure)

By the end of this course, you'll have the skills to:
- Analyze complex datasets and extract meaningful insights
- Build and deploy machine learning models
- Create compelling data visualizations
- Make data-driven business decisions
- Land a job as a data scientist or analyst

Perfect for aspiring data scientists, business analysts, and anyone looking to leverage data for better decision-making.`,
      categories: "Data Science",
      level: "Intermediate",
      price: 199,
      estimatedPrice: 299,
      tags: ["Data Science", "Machine Learning", "Python", "Statistics", "Analytics", "Business Intelligence"],
      benefits: [
        "Master Python programming for data science",
        "Learn statistical analysis and probability",
        "Build and deploy machine learning models",
        "Create compelling data visualizations",
        "Understand business intelligence concepts",
        "Gain hands-on experience with real datasets",
        "Learn to use industry-standard tools",
        "Develop a professional data science portfolio"
      ],
      prerequisites: [
        "Basic understanding of mathematics (algebra, statistics)",
        "Familiarity with any programming language (Python preferred)",
        "Basic computer skills and file management",
        "Willingness to learn and practice regularly",
        "Access to a computer with internet connection"
      ],
      thumbnail: "http://localhost:8000/uploads/thumbnail-1757601951839.png",
      demoUrl: "http://localhost:8000/uploads/videos/video-1757601919817-772207092.mp4",
      courseData: [
        {
          title: "Introduction to Data Science",
          description: "Get started with the fundamentals of data science and understand the role of a data scientist in today's world.",
          videoSection: "Module 1: Foundations",
          videos: [
            {
              title: "What is Data Science?",
              videoUrl: "http://localhost:8000/uploads/videos/video-1757601947128-920790859.mp4",
              videoLength: 15,
              description: "Introduction to data science concepts and applications",
              links: [
                {
                  title: "Data Science Roadmap",
                  url: "https://example.com/roadmap"
                },
                {
                  title: "Recommended Books",
                  url: "https://example.com/books"
                }
              ]
            },
            {
              title: "The Data Science Process",
              videoUrl: "http://localhost:8000/uploads/videos/video-1757601947128-920790859.mp4",
              videoLength: 20,
              description: "Understanding the CRISP-DM methodology and data science workflow",
              links: []
            }
          ]
        },
        {
          title: "Python for Data Science",
          description: "Learn Python programming specifically for data science applications.",
          videoSection: "Module 2: Programming",
          videos: [
            {
              title: "Python Basics for Data Science",
              videoUrl: "http://localhost:8000/uploads/videos/video-1757601947128-920790859.mp4",
              videoLength: 25,
              description: "Essential Python concepts for data manipulation and analysis",
              links: [
                {
                  title: "Python Documentation",
                  url: "https://docs.python.org"
                }
              ]
            },
            {
              title: "NumPy and Pandas",
              videoUrl: "http://localhost:8000/uploads/videos/video-1757601947128-920790859.mp4",
              videoLength: 30,
              description: "Master the essential libraries for data manipulation",
              links: []
            }
          ]
        },
        {
          title: "Statistical Analysis",
          description: "Deep dive into statistical concepts and their applications in data science.",
          videoSection: "Module 3: Statistics",
          videos: [
            {
              title: "Descriptive Statistics",
              videoUrl: "http://localhost:8000/uploads/videos/video-1757601947128-920790859.mp4",
              videoLength: 22,
              description: "Understanding mean, median, mode, and distribution analysis",
              links: []
            },
            {
              title: "Inferential Statistics",
              videoUrl: "http://localhost:8000/uploads/videos/video-1757601947128-920790859.mp4",
              videoLength: 28,
              description: "Hypothesis testing and confidence intervals",
              links: []
            }
          ]
        },
        {
          title: "Machine Learning Fundamentals",
          description: "Introduction to machine learning algorithms and their practical applications.",
          videoSection: "Module 4: Machine Learning",
          videos: [
            {
              title: "Introduction to Machine Learning",
              videoUrl: "http://localhost:8000/uploads/videos/video-1757601947128-920790859.mp4",
              videoLength: 18,
              description: "Types of machine learning and when to use each approach",
              links: []
            },
            {
              title: "Linear Regression",
              videoUrl: "http://localhost:8000/uploads/videos/video-1757601947128-920790859.mp4",
              videoLength: 35,
              description: "Building and evaluating linear regression models",
              links: []
            },
            {
              title: "Classification Algorithms",
              videoUrl: "http://localhost:8000/uploads/videos/video-1757601947128-920790859.mp4",
              videoLength: 40,
              description: "Logistic regression, decision trees, and ensemble methods",
              links: []
            }
          ]
        },
        {
          title: "Data Visualization",
          description: "Create compelling visualizations to communicate your findings effectively.",
          videoSection: "Module 5: Visualization",
          videos: [
            {
              title: "Matplotlib and Seaborn",
              videoUrl: "http://localhost:8000/uploads/videos/video-1757601947128-920790859.mp4",
              videoLength: 32,
              description: "Creating static and interactive visualizations",
              links: []
            },
            {
              title: "Advanced Visualization Techniques",
              videoUrl: "http://localhost:8000/uploads/videos/video-1757601947128-920790859.mp4",
              videoLength: 28,
              description: "Dashboard creation and storytelling with data",
              links: []
            }
          ]
        }
      ],
      createdBy: req.user?._id, // Using the same instructor ID from your data
      averageRating: 0,
      totalReviews: 0,
      reviews: []
    };

    try {
      const course = await CourseModel.create(professionalCourseData);

      res.status(201).json({
        success: true,
        message: "Professional course created successfully!",
        course,
      });
    } catch (error: any) {
      console.error("Error creating professional course:", error);
      return next(new ErrorHandler("Failed to create professional course", 500));
    }
  }
);

// Admin: Get all courses with detailed information
export const getAdminCourses = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = {};
    
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }
    
    if (req.query.category && req.query.category !== 'all') {
      filter.categories = req.query.category;
    }
    
    if (req.query.level && req.query.level !== 'all') {
      filter.level = req.query.level;
    }
    
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { 'createdBy.firstName': { $regex: req.query.search, $options: 'i' } },
        { 'createdBy.lastName': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get courses with populated instructor data
    const courses = await CourseModel.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Add default values for missing fields
    const coursesWithDefaults = courses.map(course => ({
      ...course.toObject(),
      enrolledStudents: course.enrolledStudents || 0,
      totalRevenue: course.totalRevenue || 0,
      rating: course.averageRating || 0,
      reviews: course.totalReviews || 0,
      status: course.status || 'active'
    }));

    // Get total count for pagination
    const totalCourses = await CourseModel.countDocuments(filter);
    const totalPages = Math.ceil(totalCourses / limit);

    // Get unique categories and levels for filters
    const categories = await CourseModel.distinct('categories');
    const levels = await CourseModel.distinct('level');

    // Calculate statistics
    const stats = await CourseModel.aggregate([
      {
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          activeCourses: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          pendingCourses: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          totalRevenue: { $sum: '$price' },
          totalStudents: { $sum: '$enrolledStudents' },
          averageRating: { $avg: '$averageRating' }
        }
      }
    ]);

    const courseStats = stats[0] || {
      totalCourses: 0,
      activeCourses: 0,
      pendingCourses: 0,
      totalRevenue: 0,
      totalStudents: 0,
      averageRating: 0
    };

    res.status(200).json({
      success: true,
      courses: coursesWithDefaults,
      stats: courseStats,
      categories,
      levels,
      pagination: {
        currentPage: page,
        totalPages,
        totalCourses,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error: any) {
    console.error("Error fetching admin courses:", error);
    return next(new ErrorHandler("Failed to fetch courses", 500));
  }
});

// Admin: Update course status
export const updateCourseStatus = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive', 'pending', 'rejected'].includes(status)) {
      return next(new ErrorHandler("Invalid status. Must be: active, inactive, pending, or rejected", 400));
    }

    const course = await CourseModel.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('createdBy', 'firstName lastName email');

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Course status updated successfully",
      course
    });

  } catch (error: any) {
    console.error("Error updating course status:", error);
    return next(new ErrorHandler("Failed to update course status", 500));
  }
});

// Admin: Delete course
export const deleteCourseAdmin = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const course = await CourseModel.findById(id);
    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    // Delete the course
    await CourseModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Course deleted successfully"
    });

  } catch (error: any) {
    console.error("Error deleting course:", error);
    return next(new ErrorHandler("Failed to delete course", 500));
  }
});

