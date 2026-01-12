# 🎓 Education Hub - Complete Integration Analysis

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Models](#database-models)
3. [Backend API Structure](#backend-api-structure)
4. [Frontend Components](#frontend-components)
5. [Complete User Flows](#complete-user-flows)
6. [Instructor Features](#instructor-features)
7. [Student Features](#student-features)
8. [Admin Features](#admin-features)
9. [Technical Patterns](#technical-patterns)
10. [Integration Points](#integration-points)

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE (Frontend)                  │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │  Course Browser  │  │  Course Player   │                  │
│  │  (Education Hub)│  │  (Learning View) │                  │
│  └────────┬─────────┘  └────────┬─────────┘                  │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │  My Courses      │  │  Instructor      │                  │
│  │  (Enrolled)      │  │  Dashboard       │                  │
│  └────────┬─────────┘  └────────┬─────────┘                  │
└───────────┼──────────────────────┼──────────────────────────────┘
            │                      │
            ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Node.js/Express)                │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │ Course Controller│  │ Enrollment Ctrl  │                  │
│  │ - CRUD           │  │ - Enroll         │                  │
│  │ - Search         │  │ - Progress        │                  │
│  └────────┬─────────┘  └────────┬─────────┘                  │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │ Review Controller│  │ Bookmark Ctrl    │                  │
│  │ - Ratings        │  │ - Save/Remove    │                  │
│  └────────┬─────────┘  └────────┬─────────┘                  │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │ Note Controller   │  │ Certificate Ctrl │                  │
│  │ - Take Notes      │  │ - Generate       │                  │
│  └────────┬─────────┘  └────────┬─────────┘                  │
└───────────┼──────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MONGODB DATABASE                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Courses    │  │    Orders    │  │   Reviews    │        │
│  │   (Model)    │  │   (Model)    │  │   (Model)    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Bookmarks   │  │    Notes     │  │ Certificates │        │
│  │   (Model)    │  │   (Model)    │  │   (Model)    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React + Next.js 14 + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB + Mongoose ODM
- **Video Player**: Mux Player (for course videos)
- **File Upload**: Multer (for course thumbnails)
- **Authentication**: JWT-based with role-based access control
- **UI Components**: shadcn/ui + Tailwind CSS

---

## 📊 Database Models

### 1. Course Model (`course.model.ts`)

**Schema Structure**:
```typescript
{
  name: String,                    // Course title
  description: String,             // Full course description
  categories: String,              // Course category (e.g., "Web Development")
  level: String,                   // Beginner | Intermediate | Advanced | All Levels
  price: Number,                   // Current price
  estimatedPrice: Number,          // Original price (for discounts)
  tags: [String],                  // Searchable tags
  benefits: [String],              // What students will learn
  prerequisites: [String],         // Required knowledge
  thumbnail: String,               // Course thumbnail URL
  demoUrl: String,                 // Preview video URL
  createdBy: ObjectId,             // Reference to User (instructor)
  courseData: [                    // Course content structure
    {
      title: String,               // Section title
      description: String,         // Section description
      videoSection: String,        // Section identifier
      videos: [                    // Lectures in section
        {
          title: String,           // Lecture title
          videoUrl: String,         // Mux video URL
          videoLength: Number,      // Duration in seconds
          description: String,     // Lecture description
          links: [                 // Resource links
            {
              title: String,
              url: String
            }
          ]
        }
      ]
    }
  ],
  reviews: [                       // Embedded reviews
    {
      user: ObjectId,              // Reference to User
      rating: Number,              // 1-5 stars
      comment: String,             // Review text
      createdAt: Date
    }
  ],
  averageRating: Number,           // Calculated average
  totalReviews: Number,            // Review count
  createdAt: Date,
  updatedAt: Date
}
```

**Key Features**:
- Nested structure: Course → Sections → Videos → Links
- Embedded reviews for fast access
- Populated instructor data via `createdBy` reference
- Automatic timestamp tracking

### 2. Order Model (`order.model.ts`)

**Schema Structure**:
```typescript
{
  courseId: String,                // Course ID
  userId: String,                  // Student ID
  courseName: String,              // Snapshot of course name
  coursePrice: Number,             // Price at time of purchase
  courseThumbnail: String,         // Snapshot of thumbnail
  instructorId: String,            // Instructor ID
  instructorName: String,          // Instructor name snapshot
  status: String,                  // pending | completed | cancelled | refunded
  payment_info: {
    paymentId: String,
    paymentMethod: String,
    paymentStatus: String,
    transactionId: String,
    amount: Number,
    currency: String               // Default: 'USD'
  },
  enrolledAt: Date,               // Enrollment timestamp
  completedAt: Date,               // Completion timestamp
  completedLectures: [String],     // Array of completed lecture IDs
  createdAt: Date,
  updatedAt: Date
}
```

**Key Features**:
- Snapshot pattern: Stores course data at purchase time
- Progress tracking: `completedLectures` array
- Status management: Multiple enrollment states
- Payment information: Flexible payment data structure

### 3. Review Model (`review.model.ts`)

**Schema Structure**:
```typescript
{
  courseId: ObjectId,              // Reference to Course
  userId: ObjectId,                // Reference to User (reviewer)
  rating: Number,                  // 1-5 stars
  comment: String,                 // Review text
  createdAt: Date,
  updatedAt: Date
}
```

**Key Features**:
- Separate model for detailed reviews
- Also embedded in Course model for quick access
- User and course references for relationships

### 4. Bookmark Model (`bookmark.model.ts`)

**Schema Structure**:
```typescript
{
  userId: ObjectId,                // Reference to User
  courseId: ObjectId,              // Reference to Course
  createdAt: Date
}
```

**Key Features**:
- Simple many-to-many relationship
- User can bookmark multiple courses
- Course can be bookmarked by multiple users

### 5. Note Model (`note.model.ts`)

**Schema Structure**:
```typescript
{
  userId: ObjectId,                // Reference to User
  courseId: ObjectId,              // Reference to Course
  lectureId: String,               // Specific lecture ID
  content: String,                 // Note text
  timestamp: Number,               // Video timestamp (seconds)
  createdAt: Date,
  updatedAt: Date
}
```

**Key Features**:
- Lecture-specific notes
- Timestamp tracking for video notes
- User and course references

### 6. Certificate Model (`certificate.model.ts`)

**Schema Structure**:
```typescript
{
  userId: ObjectId,                // Reference to User
  courseId: ObjectId,              // Reference to Course
  certificateUrl: String,          // Generated certificate URL
  issuedAt: Date,
  createdAt: Date
}
```

**Key Features**:
- One certificate per user per course
- Generated on course completion (100% progress)
- URL stored for download

---

## 🔧 Backend API Structure

### 1. Course Controller (`course.controller.ts`)

#### **Create Course** (`POST /api/v1/course/create`)
**Access**: Instructor/Admin only

**Request**:
- `name`: Course title
- `description`: Course description
- `categories`: Category string
- `level`: Beginner/Intermediate/Advanced/All Levels
- `price`: Current price
- `estimatedPrice`: Original price
- `tags`: JSON array of tags
- `benefits`: JSON array of benefits
- `prerequisites`: JSON array of prerequisites
- `demoUrl`: Preview video URL
- `courseData`: JSON array of sections with videos
- `thumbnail`: File upload (Multer)

**Handler Logic**:
```typescript
export const createCourse = CatchAsyncError(async (req, res, next) => {
  // 1. Validate required fields
  if (!name || !price || !demoUrl || !courseData) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }
  
  // 2. Check thumbnail upload
  if (!req.file) {
    return next(new ErrorHandler("Please upload a course thumbnail image", 400));
  }
  
  // 3. Build thumbnail URL
  const serverUrl = process.env.SERVER_URL || "http://localhost:8000";
  const thumbnail = `${serverUrl}/uploads/files/${req.file.filename}`;
  
  // 4. Parse JSON fields (if sent as strings)
  const parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
  const parsedBenefits = typeof benefits === "string" ? JSON.parse(benefits) : benefits;
  const parsedPrerequisites = typeof prerequisites === "string" ? JSON.parse(prerequisites) : prerequisites;
  const parsedCourseData = typeof courseData === "string" ? JSON.parse(courseData) : courseData;
  
  // 5. Create course with instructor ID
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
    createdBy: req.user._id,  // Instructor ID from JWT
  });
  
  // 6. Return success response
  res.status(201).json({
    success: true,
    message: "Course created successfully",
    course,
  });
});
```

**Key Points**:
- File upload handled by Multer middleware
- JSON parsing for complex fields
- Instructor ID from authenticated user
- Automatic timestamp creation

#### **Get All Courses** (`GET /api/v1/course`)
**Access**: Public

**Handler Logic**:
```typescript
export const getAllCourses = CatchAsyncError(async (req, res, next) => {
  // 1. Fetch all courses, sorted by newest
  const courses = await CourseModel.find()
    .sort({ createdAt: -1 })
    .select("name description thumbnail categories level price estimatedPrice averageRating totalReviews createdBy")
    .populate("createdBy", "username avatar");
  
  // 2. Transform to match frontend expectations
  const formattedCourses = courses.map((course) => ({
    id: course._id,
    title: course.name,
    description: course.description,
    imagePath: course.thumbnail,
    imageAltText: `${course.name} course image`,
    category: course.categories,
    price: course.price,
    originalPrice: course.estimatedPrice,
    rating: course.averageRating,
    students: course.totalReviews,  // Or actual enrollment count
    level: course.level,
    instructor: course.createdBy?.username || "Unknown Instructor",
    authorAvatar: course.createdBy?.avatar || null,
    duration: "5 hours",  // Can be calculated from courseData
  }));
  
  res.status(200).json({
    success: true,
    message: "Courses preview fetched successfully",
    courses: formattedCourses,
  });
});
```

**Key Points**:
- Public endpoint (no authentication)
- Limited field selection for performance
- Populated instructor data
- Transformed to frontend-friendly format

#### **Get Course by ID** (`GET /api/v1/course/:id`)
**Access**: Public

**Handler Logic**:
```typescript
export const getCourseById = CatchAsyncError(async (req, res, next) => {
  const courseId = req.params.id;
  
  // 1. Fetch course with instructor data
  const course = await CourseModel.findById(courseId).populate("createdBy");
  
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  
  // 2. Remove sensitive data from courseData.videos
  const courseObj = course.toObject();
  
  if (Array.isArray(courseObj.courseData)) {
    courseObj.courseData = courseObj.courseData.map((section: any) => ({
      ...section,
      videos: section.videos?.map((video: any) => {
        // Remove videoUrl and links for preview (only show in enrolled view)
        const { videoUrl, links, suggestion, questions, ...rest } = video;
        return rest;
      })
    }));
  }
  
  res.status(200).json({
    success: true,
    message: "Course details fetched successfully",
    course: courseObj,
  });
});
```

**Key Points**:
- Public preview (video URLs hidden)
- Sensitive data removed (videoUrl, links)
- Full course structure visible
- Instructor data populated

#### **Get Purchased Course** (`GET /api/v1/course/enrolled-course/:id`)
**Access**: Authenticated (enrolled students only)

**Handler Logic**:
```typescript
export const getPurchasedCourseById = CatchAsyncError(async (req, res, next) => {
  const courseId = req.params.id;
  const userId = req.user?._id;
  
  // 1. Fetch course
  const course = await CourseModel.findById(courseId).populate("createdBy");
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  
  // 2. Return full course data (including video URLs)
  res.status(200).json({
    success: true,
    message: "Purchased course details fetched successfully",
    course,  // Full course with video URLs
  });
});
```

**Key Points**:
- Authenticated endpoint
- Full course data (including video URLs)
- Access control handled by frontend/route guards

#### **Update Course** (`PUT /api/v1/course/:id`)
**Access**: Instructor/Admin (course owner only)

**Handler Logic**:
```typescript
export const updateCourse = CatchAsyncError(async (req, res, next) => {
  const courseId = req.params.id;
  const updates = req.body;
  
  // 1. Find course
  const course = await CourseModel.findById(courseId);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  
  // 2. Check ownership
  if (course.createdBy.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("You are not authorized to update this course", 403));
  }
  
  // 3. Parse JSON fields if needed
  const parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
  const parsedBenefits = typeof benefits === "string" ? JSON.parse(benefits) : benefits;
  const parsedPrerequisites = typeof prerequisites === "string" ? JSON.parse(prerequisites) : prerequisites;
  const parsedCourseData = typeof courseData === "string" ? JSON.parse(courseData) : courseData;
  
  // 4. Update fields
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
  
  // 5. Handle thumbnail update if provided
  if (req.file) {
    const serverUrl = process.env.SERVER_URL || "http://localhost:8000";
    course.thumbnail = `${serverUrl}/uploads/files/${req.file.filename}`;
  }
  
  // 6. Save changes
  await course.save();
  
  res.status(200).json({
    success: true,
    message: "Course updated successfully",
    course,
  });
});
```

**Key Points**:
- Ownership verification
- Partial updates supported
- Thumbnail update optional
- Automatic timestamp update

#### **Delete Course** (`DELETE /api/v1/course/:id`)
**Access**: Instructor/Admin (course owner only)

**Handler Logic**:
```typescript
export const deleteCourse = CatchAsyncError(async (req, res, next) => {
  const courseId = req.params.id;
  
  // 1. Find course
  const course = await CourseModel.findById(courseId);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  
  // 2. Check ownership
  if (course.createdBy.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("You are not authorized to delete this course", 403));
  }
  
  // 3. Delete course
  await course.deleteOne();
  
  res.status(200).json({
    success: true,
    message: "Course deleted successfully",
  });
});
```

**Key Points**:
- Ownership verification
- Hard delete (no soft delete)
- Related orders remain (for historical data)

#### **Get Instructor Courses** (`GET /api/v1/course/instructor/my-courses`)
**Access**: Instructor/Admin only

**Handler Logic**:
```typescript
export const getInstructorCourses = CatchAsyncError(async (req, res, next) => {
  const instructorId = req.user._id;
  
  // 1. Find all courses by instructor
  const courses = await CourseModel.find({ createdBy: instructorId })
    .sort({ createdAt: -1 })
    .populate("createdBy", "username avatar");
  
  res.status(200).json({
    success: true,
    message: "Instructor courses fetched successfully",
    courses,
  });
});
```

**Key Points**:
- Filtered by authenticated instructor
- Sorted by newest first
- Full course data returned

### 2. Enrollment Controller (`enrollment.controller.ts`)

#### **Enroll in Course** (`POST /api/v1/enrollment/enroll/:courseId`)
**Access**: Authenticated users

**Handler Logic**:
```typescript
export const enrollInCourse = CatchAsyncError(async (req, res, next) => {
  const { courseId } = req.params;
  const userId = req.user._id;
  
  // 1. Check if course exists
  const course = await CourseModel.findById(courseId)
    .populate("createdBy", "firstName lastName username");
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  
  // 2. Check if already enrolled
  const existingOrder = await OrderModel.findOne({
    courseId: courseId,
    userId: userId,
    status: { $in: ['pending', 'completed'] }
  });
  
  if (existingOrder) {
    return next(new ErrorHandler("You are already enrolled in this course", 400));
  }
  
  // 3. Check if user is trying to enroll in their own course
  if (course.createdBy._id.toString() === userId.toString()) {
    return next(new ErrorHandler("You cannot enroll in your own course", 400));
  }
  
  // 4. Create order for enrollment
  const orderData = {
    courseId: courseId,
    userId: userId,
    courseName: course.name,
    coursePrice: course.price,
    courseThumbnail: course.thumbnail,
    instructorId: course.createdBy._id.toString(),
    instructorName: `${course.createdBy.firstName} ${course.createdBy.lastName}`,
    status: 'completed',  // Auto-complete (payment handled separately)
    payment_info: {
      paymentMethod: 'free_enrollment',
      paymentStatus: 'completed',
      amount: course.price,
      currency: 'USD'
    },
    enrolledAt: new Date(),
    completedAt: new Date()
  };
  
  const order = await OrderModel.create(orderData);
  
  res.status(201).json({
    success: true,
    message: "Successfully enrolled in course!",
    order: {
      _id: order._id,
      courseId: order.courseId,
      courseName: order.courseName,
      coursePrice: order.coursePrice,
      status: order.status,
      enrolledAt: order.enrolledAt
    }
  });
});
```

**Key Points**:
- Duplicate enrollment prevention
- Self-enrollment prevention
- Order creation with snapshot data
- Auto-complete status (payment integration ready)

#### **Get User's Enrolled Courses** (`GET /api/v1/enrollment/my-courses`)
**Access**: Authenticated users

**Handler Logic**:
```typescript
export const getUserEnrolledCourses = CatchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  
  // 1. Find all completed orders for user
  const enrolledCourses = await OrderModel.find({
    userId: userId,
    status: { $in: ['completed'] }
  }).sort({ enrolledAt: -1 });
  
  // 2. Get course details for each enrollment
  const coursesWithDetails = await Promise.all(
    enrolledCourses.map(async (order) => {
      const course = await CourseModel.findById(order.courseId)
        .populate("createdBy", "firstName lastName username avatar");
      
      // Skip if course was deleted
      if (!course) return null;
      
      return {
        orderId: order._id,
        courseId: order.courseId,
        courseName: order.courseName,
        courseThumbnail: order.courseThumbnail,
        coursePrice: order.coursePrice,
        instructor: course.createdBy,
        enrolledAt: order.enrolledAt,
        status: order.status,
        course: course
      };
    })
  );
  
  // 3. Filter out null values (deleted courses)
  const validCourses = coursesWithDetails.filter(course => course !== null);
  
  res.status(200).json({
    success: true,
    message: "Enrolled courses fetched successfully",
    courses: validCourses
  });
});
```

**Key Points**:
- Filters by user ID and completed status
- Handles deleted courses gracefully
- Populates instructor data
- Returns order and course data combined

#### **Check Enrollment** (`GET /api/v1/enrollment/check/:courseId`)
**Access**: Authenticated users

**Handler Logic**:
```typescript
export const checkEnrollment = CatchAsyncError(async (req, res, next) => {
  const { courseId } = req.params;
  const userId = req.user._id;
  
  // 1. Find enrollment
  const enrollment = await OrderModel.findOne({
    courseId: courseId,
    userId: userId,
    status: { $in: ['completed'] }
  });
  
  res.status(200).json({
    success: true,
    isEnrolled: !!enrollment,
    enrollment: enrollment ? {
      orderId: enrollment._id,
      enrolledAt: enrollment.enrolledAt,
      status: enrollment.status
    } : null
  });
});
```

**Key Points**:
- Simple boolean check
- Returns enrollment details if found
- Used for access control

#### **Check Course Access** (`GET /api/v1/enrollment/access/:courseId`)
**Access**: Authenticated users

**Handler Logic**:
```typescript
export const checkCourseAccess = CatchAsyncError(async (req, res, next) => {
  const { courseId } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;
  
  // 1. Check if course exists
  const course = await CourseModel.findById(courseId)
    .populate("createdBy", "firstName lastName username");
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  
  // 2. Check access levels
  const isAdmin = userRole === 'admin';
  const isInstructor = course.createdBy._id.toString() === userId.toString();
  const enrollment = await OrderModel.findOne({
    courseId: courseId,
    userId: userId,
    status: { $in: ['completed'] }
  });
  const isEnrolled = !!enrollment;
  
  // 3. Determine access level
  let accessLevel = 'none';
  let hasAccess = false;
  
  if (isAdmin) {
    accessLevel = 'admin';
    hasAccess = true;
  } else if (isInstructor) {
    accessLevel = 'instructor';
    hasAccess = true;
  } else if (isEnrolled) {
    accessLevel = 'student';
    hasAccess = true;
  }
  
  res.status(200).json({
    success: true,
    hasAccess,
    accessLevel,
    isAdmin,
    isInstructor,
    isEnrolled,
    course: {
      _id: course._id,
      name: course.name,
      description: course.description,
      thumbnail: course.thumbnail,
      price: course.price,
      level: course.level,
      createdBy: course.createdBy
    },
    enrollment: enrollment ? {
      orderId: enrollment._id,
      enrolledAt: enrollment.enrolledAt,
      status: enrollment.status
    } : null
  });
});
```

**Key Points**:
- Comprehensive access check
- Multiple access levels (admin, instructor, student, none)
- Returns course and enrollment data
- Used for route guards

#### **Mark Lecture Complete** (`POST /api/v1/enrollment/progress/:courseId/:lectureId/complete`)
**Access**: Authenticated enrolled students

**Handler Logic**:
```typescript
export const markLectureComplete = CatchAsyncError(async (req, res, next) => {
  const { courseId, lectureId } = req.params;
  const userId = req.user._id;
  
  // 1. Check if user is enrolled
  const enrollment = await OrderModel.findOne({
    courseId: courseId,
    userId: userId,
    status: 'completed'
  });
  
  if (!enrollment) {
    return next(new ErrorHandler("You are not enrolled in this course", 403));
  }
  
  // 2. Check if lecture exists in course
  const course = await CourseModel.findById(courseId);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  
  const lectureExists = course.courseData
    .flatMap(section => section.videos)
    .some(video => video._id.toString() === lectureId);
  
  if (!lectureExists) {
    return next(new ErrorHandler("Lecture not found", 404));
  }
  
  // 3. Add lecture to completed lectures if not already there
  if (!enrollment.completedLectures) {
    enrollment.completedLectures = [];
  }
  
  if (!enrollment.completedLectures.includes(lectureId)) {
    enrollment.completedLectures.push(lectureId);
    await enrollment.save();
  }
  
  res.status(200).json({
    success: true,
    message: "Lecture marked as completed",
    completedLectures: enrollment.completedLectures
  });
});
```

**Key Points**:
- Enrollment verification
- Lecture existence check
- Duplicate prevention
- Progress tracking

#### **Get Course Progress** (`GET /api/v1/enrollment/progress/:courseId`)
**Access**: Authenticated enrolled students

**Handler Logic**:
```typescript
export const getCourseProgress = CatchAsyncError(async (req, res, next) => {
  const { courseId } = req.params;
  const userId = req.user._id;
  
  // 1. Check enrollment
  const enrollment = await OrderModel.findOne({
    courseId: courseId,
    userId: userId,
    status: 'completed'
  });
  
  if (!enrollment) {
    return next(new ErrorHandler("You are not enrolled in this course", 403));
  }
  
  // 2. Get course details
  const course = await CourseModel.findById(courseId);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }
  
  // 3. Calculate progress
  const totalLectures = course.courseData
    .flatMap(section => section.videos)
    .length;
  
  const completedLectures = enrollment.completedLectures?.length || 0;
  const progressPercentage = totalLectures > 0 
    ? (completedLectures / totalLectures) * 100 
    : 0;
  
  res.status(200).json({
    success: true,
    progress: {
      totalLectures,
      completedLectures,
      progressPercentage: Math.round(progressPercentage),
      completedLectureIds: enrollment.completedLectures || []
    }
  });
});
```

**Key Points**:
- Enrollment verification
- Progress calculation
- Percentage rounding
- Returns completed lecture IDs

---

## 🎨 Frontend Components

### 1. Education Hub Main Page (`educationhub/page.tsx`)

**Purpose**: Course browsing and discovery

**Key Features**:
- Course grid/list view toggle
- Search functionality
- Category filtering
- Sorting (popular, newest, price, rating)
- Pagination (12 courses per page)
- Purchase status indicators
- Progress tracking for enrolled courses

**State Management**:
```typescript
const [searchTerm, setSearchTerm] = useState("");
const [selectedCategory, setSelectedCategory] = useState("All");
const [sortBy, setSortBy] = useState("newest");
const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
const [courses, setCourses] = useState<Course[]>([]);
const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
const [currentPage, setCurrentPage] = useState(1);
const [categories, setCategories] = useState<{name: string, count: number}[]>([]);
```

**Data Fetching**:
```typescript
// Fetch all courses
const fetchCourses = useCallback(async () => {
  const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI}course`, {
    withCredentials: true
  });
  
  if (res.data.success) {
    const courseData: Course[] = res.data.courses.map((course: any) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      imagePath: course.imagePath,
      category: course.category,
      price: course.price,
      originalPrice: course.originalPrice,
      rating: course.rating,
      students: course.students,
      level: course.level,
      instructor: course.instructor,
      isPurchased: false,  // Updated after fetching enrolled courses
    }));
    
    setCourses(courseData);
    
    // Generate dynamic categories
    const categoryMap = new Map<string, number>();
    courseData.forEach(course => {
      const category = course.category || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    const dynamicCategories = [
      { name: "All", count: courseData.length },
      ...Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))
    ];
    setCategories(dynamicCategories);
  }
}, []);

// Fetch user's enrolled courses
const fetchEnrolledCourses = useCallback(async () => {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_SERVER_URI}enrollment/my-courses`,
    { withCredentials: true }
  );
  
  if (response.data.success) {
    const enrolledData: EnrolledCourse[] = response.data.courses;
    setEnrolledCourses(enrolledData);
    
    // Update courses with purchased status
    setCourses(prevCourses => 
      prevCourses.map(course => {
        const enrolledCourse = enrolledData.find(ec => ec.courseId === course.id);
        return {
          ...course,
          isPurchased: !!enrolledCourse,
          progress: enrolledCourse?.progress
        };
      })
    );
  }
}, []);
```

**Filtering & Sorting**:
```typescript
// Filter courses
const filteredCourses = courses.filter((course: Course) => {
  const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
  return matchesSearch && matchesCategory;
});

// Sort courses
const sortedCourses = [...filteredCourses].sort((a, b) => {
  switch (sortBy) {
    case "newest": return 0;  // Already sorted by backend
    case "price-asc": return a.price - b.price;
    case "price-desc": return b.price - a.price;
    case "rating": return b.rating - a.rating;
    case "purchased":
      if (a.isPurchased && !b.isPurchased) return -1;
      if (!a.isPurchased && b.isPurchased) return 1;
      return 0;
    case "popular": return b.students - a.students;
    default: return 0;
  }
});
```

**Pagination**:
```typescript
const startIndex = (currentPage - 1) * coursesPerPage;
const endIndex = startIndex + coursesPerPage;
const paginatedCourses = sortedCourses.slice(startIndex, endIndex);
const totalPages = Math.ceil(sortedCourses.length / coursesPerPage);
```

### 2. Course Preview Page (`educationhub/[courseId]/page.tsx`)

**Purpose**: Course details and enrollment

**Key Features**:
- Course information display
- Instructor profile
- Course curriculum preview (sections/videos)
- Enrollment button
- Bookmark functionality
- Review section
- Demo video player

**Data Fetching**:
```typescript
useEffect(() => {
  const fetchCourse = async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_SERVER_URI}course/${courseId}`,
      { withCredentials: true }
    );
    
    if (res.data.success) {
      const data = res.data.course;
      setCourse(data);
      setExpandedSections(data.courseData?.map((_: any, idx: number) => idx) || []);
      
      // Check if current user is the course instructor
      if (user && data.createdBy && data.createdBy._id === user._id) {
        setIsCourseInstructor(true);
      }
      
      // Fetch instructor data
      if (data.createdBy && data.createdBy._id) {
        fetchInstructorData(data.createdBy._id);
      }
    }
  };
  
  if (courseId) {
    fetchCourse();
    checkEnrollment();
    checkBookmarkStatus();
  }
}, [courseId]);
```

**Enrollment Flow**:
```typescript
const handleEnroll = async () => {
  try {
    setEnrolling(true);
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_SERVER_URI}enrollment/enroll/${courseId}`,
      {},
      { withCredentials: true }
    );
    
    if (response.data.success) {
      toast({
        title: "Success!",
        description: "You have been enrolled in this course!",
      });
      setIsEnrolled(true);
      // Redirect to course content
      router.push(`/courses/${courseId}`);
    }
  } catch (error: any) {
    toast({
      title: "Enrollment Failed",
      description: error.response?.data?.message || "Failed to enroll in course",
      variant: "destructive",
    });
  } finally {
    setEnrolling(false);
  }
};
```

### 3. Course Player Page (`courses/[courseId]/page.tsx`)

**Purpose**: Learning interface for enrolled students

**Key Features**:
- Video player (Mux Player)
- Course sidebar with sections/lectures
- Progress tracking
- Notes taking
- Bookmark functionality
- Certificate download (when 100% complete)
- Lecture completion tracking

**State Management**:
```typescript
const [sections, setSections] = useState<Section[]>([]);
const [currentLecture, setCurrentLecture] = useState<Lecture | null>(null);
const [expandedSections, setExpandedSections] = useState<string[]>([]);
const [completedLectures, setCompletedLectures] = useState<string[]>([]);
const [progress, setProgress] = useState({
  totalLectures: 0,
  completedLectures: 0,
  progressPercentage: 0
});
const [certificateEligible, setCertificateEligible] = useState(false);
```

**Progress Tracking**:
```typescript
const fetchCourseProgress = useCallback(async () => {
  if (!id) return;
  
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_SERVER_URI}enrollment/progress/${id}`,
      { withCredentials: true }
    );
    
    if (response.data.success) {
      const progressData = response.data.progress;
      setProgress(progressData);
      setCompletedLectures(progressData.completedLectureIds || []);
    }
  } catch (error: any) {
    console.error("Error fetching course progress:", error);
  }
}, [id]);
```

**Lecture Completion**:
```typescript
const markLectureComplete = async (lectureId: string) => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_SERVER_URI}enrollment/progress/${id}/${lectureId}/complete`,
      {},
      { withCredentials: true }
    );
    
    if (response.data.success) {
      setCompletedLectures(prev => [...prev, lectureId]);
      // Refresh progress
      fetchCourseProgress();
      // Check certificate eligibility
      checkCertificateEligibility();
    }
  } catch (error: any) {
    console.error("Error marking lecture complete:", error);
  }
};
```

**Certificate Download**:
```typescript
const downloadCertificate = async () => {
  if (!id) return;
  
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_SERVER_URI}certificate/generate/${id}`,
      { 
        withCredentials: true,
        responseType: 'blob'
      }
    );
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `0xMintyn-Certificate-${courseName.replace(/[^a-zA-Z0-9]/g, '-')}.png`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Certificate Downloaded!",
      description: "Your certificate has been downloaded successfully.",
    });
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.response?.data?.message || "Failed to download certificate",
      variant: "destructive",
    });
  }
};
```

### 4. My Courses Page (`my-courses/page.tsx`)

**Purpose**: Display user's enrolled courses with progress

**Key Features**:
- Enrolled courses grid
- Progress bars
- Search and filtering
- Continue learning buttons
- Course statistics

**Data Fetching**:
```typescript
const fetchEnrolledCourses = async () => {
  try {
    setLoading(true);
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_SERVER_URI}enrollment/my-courses`,
      { withCredentials: true }
    );
    
    if (response.data.success) {
      const baseCourses: EnrolledCourse[] = response.data.courses;
      
      // Fetch progress for each enrolled course
      const coursesWithProgress = await Promise.all(
        baseCourses.map(async (course) => {
          try {
            const progressRes = await axios.get(
              `${process.env.NEXT_PUBLIC_SERVER_URI}enrollment/progress/${course.courseId}`,
              { withCredentials: true }
            );
            
            if (progressRes.data?.success && progressRes.data.progress) {
              return {
                ...course,
                progress: progressRes.data.progress as CourseProgress,
              };
            }
          } catch (err) {
            console.error(`Error fetching progress for course ${course.courseId}:`, err);
          }
          return course;
        })
      );
      
      setCourses(coursesWithProgress);
    }
  } catch (error: any) {
    console.error("Error fetching enrolled courses:", error);
    toast({
      title: "Error",
      description: "Failed to load your courses",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
```

### 5. Course Access Guard (`CourseAccessGuard.tsx`)

**Purpose**: Route protection for course content

**Logic**:
```typescript
const CourseAccessGuard = ({ courseId, children }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_URI}enrollment/access/${courseId}`,
          { withCredentials: true }
        );
        
        if (response.data.success && response.data.hasAccess) {
          setHasAccess(true);
        } else {
          router.push(`/educationhub/${courseId}`);
        }
      } catch (error) {
        router.push(`/educationhub/${courseId}`);
      } finally {
        setLoading(false);
      }
    };
    
    checkAccess();
  }, [courseId]);
  
  if (loading) return <Spinner />;
  if (!hasAccess) return null;
  
  return <>{children}</>;
};
```

---

## 🔄 Complete User Flows

### 1. Course Creation Flow (Instructor)

```
Instructor clicks "Create Course"
    ↓
Frontend: /create-course page
    ├─ Form with sections:
    │   ├─ Basic Info (name, description, category, level)
    │   ├─ Pricing (price, estimatedPrice)
    │   ├─ Course Content (sections, videos)
    │   ├─ Tags, Benefits, Prerequisites
    │   └─ Thumbnail upload
    ↓
Instructor fills form and submits
    ↓
Frontend: POST /api/v1/course/create
    ├─ FormData with:
    │   ├─ Text fields
    │   ├─ JSON arrays (tags, benefits, prerequisites, courseData)
    │   └─ Thumbnail file
    └─ JWT token in cookies
    ↓
Backend: createCourse controller
    ├─ Validate required fields
    ├─ Check file upload (Multer)
    ├─ Parse JSON fields
    ├─ Build thumbnail URL
    ├─ Create course in MongoDB
    └─ Return course data
    ↓
Frontend: Redirect to instructor dashboard
    ↓
✅ Course created and visible in Education Hub
```

### 2. Course Enrollment Flow (Student)

```
Student browses courses in Education Hub
    ↓
Student clicks on a course
    ↓
Frontend: /educationhub/[courseId] page
    ├─ Fetch course details (GET /api/v1/course/:id)
    ├─ Check enrollment status (GET /api/v1/enrollment/check/:courseId)
    └─ Check bookmark status
    ↓
Student views course details
    ├─ Course information
    ├─ Instructor profile
    ├─ Curriculum preview
    ├─ Reviews
    └─ Demo video
    ↓
Student clicks "Enroll Now"
    ↓
Frontend: POST /api/v1/enrollment/enroll/:courseId
    └─ JWT token in cookies
    ↓
Backend: enrollInCourse controller
    ├─ Check if course exists
    ├─ Check if already enrolled
    ├─ Check if own course
    ├─ Create order with status 'completed'
    └─ Return enrollment data
    ↓
Frontend: Redirect to /courses/[courseId]
    ↓
✅ Student enrolled and can access course content
```

### 3. Course Learning Flow (Student)

```
Student accesses enrolled course
    ↓
Frontend: /courses/[courseId] page
    ├─ CourseAccessGuard checks access
    ├─ Fetch full course data (GET /api/v1/course/enrolled-course/:id)
    ├─ Fetch progress (GET /api/v1/enrollment/progress/:courseId)
    └─ Check certificate eligibility
    ↓
Course Player loads
    ├─ Video player (Mux Player)
    ├─ Course sidebar (sections/lectures)
    ├─ Progress bar
    └─ Notes section
    ↓
Student watches lecture
    ↓
Student completes lecture
    ↓
Frontend: POST /api/v1/enrollment/progress/:courseId/:lectureId/complete
    └─ Mark lecture as completed
    ↓
Backend: markLectureComplete controller
    ├─ Verify enrollment
    ├─ Verify lecture exists
    ├─ Add lecture ID to completedLectures array
    └─ Save order
    ↓
Frontend: Update UI
    ├─ Mark lecture as completed (checkmark)
    ├─ Update progress bar
    └─ Check if 100% complete (certificate eligible)
    ↓
✅ Progress tracked and displayed
```

### 4. Progress Tracking Flow

```
Student accesses course
    ↓
Frontend: GET /api/v1/enrollment/progress/:courseId
    ↓
Backend: getCourseProgress controller
    ├─ Verify enrollment
    ├─ Get course (count total lectures)
    ├─ Get enrollment (count completed lectures)
    ├─ Calculate percentage
    └─ Return progress data
    ↓
Frontend: Display progress
    ├─ Progress bar
    ├─ "X of Y lectures completed"
    └─ Percentage display
    ↓
Student completes more lectures
    ↓
Progress updates in real-time
    ↓
When 100% complete:
    ├─ Certificate becomes available
    └─ Student can download certificate
    ↓
✅ Progress tracked throughout course
```

### 5. Certificate Generation Flow

```
Student completes 100% of course
    ↓
Frontend: Check certificate eligibility
    ├─ GET /api/v1/certificate/eligibility/:courseId
    └─ Verify 100% progress
    ↓
Backend: Check eligibility
    ├─ Verify enrollment
    ├─ Check progress (100%)
    ├─ Check if certificate already exists
    └─ Return eligibility status
    ↓
Frontend: Show "Download Certificate" button
    ↓
Student clicks "Download Certificate"
    ↓
Frontend: GET /api/v1/certificate/generate/:courseId
    └─ responseType: 'blob'
    ↓
Backend: Generate certificate
    ├─ Verify eligibility
    ├─ Generate certificate image (canvas/PDF)
    ├─ Include:
    │   ├─ Student name
    │   ├─ Course name
    │   ├─ Completion date
    │   └─ Platform branding
    ├─ Save to storage (optional)
    ├─ Create certificate record
    └─ Return certificate file
    ↓
Frontend: Download file
    ├─ Create blob URL
    ├─ Create download link
    ├─ Trigger download
    └─ Clean up
    ↓
✅ Certificate downloaded
```

---

## 👨‍🏫 Instructor Features

### 1. Course Management

**Pages**:
- `/create-course` - Create new course
- `/instructor/my_courses` - View all instructor courses
- `/instructor/courses/[courseId]` - Course details (instructor view)
- `/instructor/courses/[courseId]/edit` - Edit course

**Features**:
- Create courses with sections and videos
- Upload course thumbnail
- Edit course content
- Delete courses
- View course analytics
- Manage students

### 2. Instructor Dashboard

**Features**:
- Total courses created
- Total students enrolled
- Total earnings
- Course performance metrics
- Recent enrollments

### 3. Student Management

**Features**:
- View enrolled students
- Track student progress
- View student reviews
- Respond to student questions

---

## 👨‍🎓 Student Features

### 1. Course Discovery

**Features**:
- Browse all courses
- Search courses
- Filter by category
- Sort by various criteria
- View course previews
- Read reviews

### 2. Enrollment

**Features**:
- Enroll in courses
- View enrolled courses
- Track progress
- Continue learning

### 3. Learning Experience

**Features**:
- Watch course videos
- Take notes
- Bookmark courses
- Mark lectures complete
- Track progress
- Download certificates

### 4. Social Features

**Features**:
- Write reviews
- Rate courses
- View instructor profiles
- See other students' progress

---

## 👑 Admin Features

### 1. Course Management

**Features**:
- View all courses
- Approve/reject courses
- Edit any course
- Delete courses
- View course analytics

### 2. Order Management

**Features**:
- View all enrollments
- Filter by status
- Update order status
- View revenue statistics

### 3. User Management

**Features**:
- View all students
- View all instructors
- Manage user roles
- View user analytics

---

## 🎯 Technical Patterns

### 1. Role-Based Access Control (RBAC)

**Implementation**:
```typescript
// Middleware: requireInstructorOrAdmin
export const requireInstructorOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'instructor' && req.user?.role !== 'admin') {
    return next(new ErrorHandler("Access denied. Instructor or Admin role required.", 403));
  }
  next();
};

// Frontend: RoleProtected component
<AdminOrInstructorProtected>
  <CreateCoursePage />
</AdminOrInstructorProtected>
```

**Access Levels**:
- **Public**: Browse courses, view course previews
- **Authenticated**: Enroll in courses, track progress
- **Instructor**: Create/edit own courses
- **Admin**: Full access to all courses

### 2. Snapshot Pattern

**Why**: Course data may change after enrollment

**Implementation**:
```typescript
// Order stores snapshot of course data
const orderData = {
  courseId: courseId,
  courseName: course.name,           // Snapshot
  coursePrice: course.price,         // Snapshot
  courseThumbnail: course.thumbnail, // Snapshot
  instructorName: `${instructor.firstName} ${instructor.lastName}`, // Snapshot
  // ...
};
```

**Benefits**:
- Historical accuracy
- Price protection
- Instructor name preservation

### 3. Progress Tracking Pattern

**Implementation**:
```typescript
// Store completed lecture IDs in order
completedLectures: [String]  // Array of lecture IDs

// Calculate progress
const totalLectures = course.courseData
  .flatMap(section => section.videos)
  .length;

const completedLectures = enrollment.completedLectures?.length || 0;
const progressPercentage = (completedLectures / totalLectures) * 100;
```

**Benefits**:
- Efficient storage (only IDs)
- Easy to query
- Accurate progress calculation

### 4. Embedded vs Referenced Data

**Embedded (Reviews in Course)**:
- Fast access
- No additional queries
- Used for: Quick display, average rating

**Referenced (Separate Review Model)**:
- Detailed reviews
- Additional fields
- Used for: Full review pages, review management

### 5. File Upload Pattern

**Implementation**:
```typescript
// Multer middleware
router.post(
  "/create",
  upload.single("thumbnail"),
  createCourse
);

// Controller
if (!req.file) {
  return next(new ErrorHandler("Please upload a course thumbnail image", 400));
}

const serverUrl = process.env.SERVER_URL || "http://localhost:8000";
const thumbnail = `${serverUrl}/uploads/files/${req.file.filename}`;
```

**Storage**:
- Files stored in `uploads/files/`
- URLs stored in database
- Served statically by Express

---

## 🔗 Integration Points

### 1. Authentication Integration

**JWT Token**:
- Stored in HTTP-only cookies
- Automatically sent with requests
- Refreshed via middleware

**User Context**:
```typescript
const { user, isAuthenticated } = useAuth();
const isInstructor = user?.role === 'instructor';
const isAdmin = user?.role === 'admin';
```

### 2. Video Player Integration

**Mux Player**:
```typescript
import MuxPlayer from "@mux/mux-player-react";

<MuxPlayer
  streamType="on-demand"
  playbackId={currentLecture.videoUrl}
  metadata={{
    video_title: currentLecture.title,
    course_name: courseName,
  }}
  onEnded={() => {
    // Mark lecture as complete
    markLectureComplete(currentLecture.id);
  }}
/>
```

**Features**:
- On-demand streaming
- Playback tracking
- Automatic completion on video end

### 3. Review Integration

**Review Component**:
```typescript
<ReviewSection
  courseId={courseId}
  reviews={course.reviews}
  averageRating={course.averageRating}
  totalReviews={course.totalReviews}
  canReview={isEnrolled && !hasReviewed}
/>
```

**Features**:
- Display reviews
- Submit reviews
- Rating display
- Review management

### 4. Bookmark Integration

**Bookmark API**:
```typescript
// Add bookmark
POST /api/v1/bookmark/add
{ courseId: string }

// Remove bookmark
DELETE /api/v1/bookmark/remove/:courseId

// Check status
GET /api/v1/bookmark/status/:courseId
```

**Features**:
- Save courses for later
- Quick access to bookmarked courses
- Bookmark indicator in UI

### 5. Notes Integration

**Notes API**:
```typescript
// Create note
POST /api/v1/note/create
{ courseId, lectureId, content, timestamp }

// Get notes
GET /api/v1/note/course/:courseId

// Update note
PUT /api/v1/note/:noteId

// Delete note
DELETE /api/v1/note/:noteId
```

**Features**:
- Lecture-specific notes
- Timestamp tracking
- Rich text support
- Note management

---

## 📊 Summary

### Key Achievements

1. **Complete Course Management**:
   - Full CRUD operations for courses
   - Section and video organization
   - Rich course metadata

2. **Enrollment System**:
   - Seamless enrollment flow
   - Order management
   - Progress tracking

3. **Learning Experience**:
   - Video player integration
   - Progress tracking
   - Notes taking
   - Certificate generation

4. **Social Features**:
   - Reviews and ratings
   - Bookmarks
   - Instructor profiles

5. **Role-Based Access**:
   - Student, Instructor, Admin roles
   - Appropriate access levels
   - Route protection

### Technical Highlights

- **MongoDB Schema Design**: Nested structures, embedded vs referenced data
- **Progress Tracking**: Efficient ID-based tracking
- **File Upload**: Multer integration for thumbnails
- **Video Streaming**: Mux Player integration
- **Access Control**: Comprehensive RBAC implementation
- **State Management**: React hooks and context
- **Error Handling**: Comprehensive error handling throughout

### Database Relationships

```
User (1) ──→ (N) Course (createdBy)
User (1) ──→ (N) Order (userId)
Course (1) ──→ (N) Order (courseId)
User (1) ──→ (N) Review (userId)
Course (1) ──→ (N) Review (courseId)
User (1) ──→ (N) Bookmark (userId)
Course (1) ──→ (N) Bookmark (courseId)
User (1) ──→ (N) Note (userId)
Course (1) ──→ (N) Note (courseId)
User (1) ──→ (N) Certificate (userId)
Course (1) ──→ (N) Certificate (courseId)
```

### API Endpoints Summary

**Course Endpoints**:
- `GET /api/v1/course` - Get all courses
- `GET /api/v1/course/:id` - Get course preview
- `GET /api/v1/course/enrolled-course/:id` - Get full course (enrolled)
- `POST /api/v1/course/create` - Create course (instructor)
- `PUT /api/v1/course/:id` - Update course (instructor)
- `DELETE /api/v1/course/:id` - Delete course (instructor)
- `GET /api/v1/course/instructor/my-courses` - Get instructor courses

**Enrollment Endpoints**:
- `POST /api/v1/enrollment/enroll/:courseId` - Enroll in course
- `GET /api/v1/enrollment/my-courses` - Get enrolled courses
- `GET /api/v1/enrollment/check/:courseId` - Check enrollment
- `GET /api/v1/enrollment/access/:courseId` - Check access
- `POST /api/v1/enrollment/progress/:courseId/:lectureId/complete` - Mark complete
- `GET /api/v1/enrollment/progress/:courseId` - Get progress

**Additional Endpoints**:
- Review endpoints (create, get, update, delete)
- Bookmark endpoints (add, remove, status, list)
- Note endpoints (create, get, update, delete)
- Certificate endpoints (eligibility, generate)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-25  
**Author**: AI Assistant  
**Status**: Complete Education Hub Analysis

