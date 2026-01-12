# Complete Backend Controllers Analysis

## 📋 **Overview**
This document provides a comprehensive analysis of all controllers in the backend, detailing their functionality, endpoints, request/response formats, and business logic.

---

## 🎯 **Controller Categories**

### **1. User Management Controllers**

#### **`user.controller.ts`** (1,120 lines)
**Purpose**: Complete user lifecycle management including authentication, profile, wallet, and social accounts.

**Key Functions**:

1. **`registrationUser`** - User Registration
   - Validates email, username, password
   - Validates Solana wallet address (if provided)
   - Checks for duplicate email/username/wallet
   - Generates activation token and code
   - Sends activation email with code and link
   - Returns activation token

2. **`activateUserAccount`** - Account Activation (Code-based)
   - Verifies activation token and code
   - Checks for duplicate users
   - Creates user account
   - Handles JWT expiration errors

3. **`activateUserAccountByLink`** - Account Activation (Link-based)
   - Token-only activation (no code input)
   - Sets walletConnectedAt if wallet provided
   - Creates user account

4. **`loginUser`** - User Login
   - Validates email and password
   - Compares password with bcrypt
   - Generates and sends JWT tokens (access + refresh)
   - Sets HTTP-only cookies

5. **`logoutUser`** - User Logout
   - Clears access_token and refresh_token cookies
   - Handles production/development cookie settings

6. **`updateAccessToken`** - Refresh Access Token (Route Handler)
   - Verifies refresh token
   - Generates new access and refresh tokens
   - Updates cookies
   - Returns user info

7. **`updateAccessTokenMiddleware`** - Refresh Token Middleware
   - Same as above but continues to next middleware
   - Sets user in request object

8. **`getUserInfo`** - Get Current User
   - Returns authenticated user's information
   - Uses service layer

9. **`updateProfile`** - Update User Profile
   - Updates: firstName, lastName, dateOfBirth, nationality, age, contactNumber, bio
   - Partial updates (only provided fields)

10. **`updateProfilePicture`** - Update Avatar
    - Handles file upload via Multer
    - Saves to `/uploads/files/`
    - Updates user avatar URL

11. **`updateBannerPicture`** - Update Banner
    - Similar to avatar update
    - Updates user banner URL

12. **`updateUserName`** - Update Username
    - Validates username uniqueness
    - Updates username

13. **`getAllUsers`** - Get All Users (Admin)
    - Returns all users (password excluded)
    - Sorted by creation date

14. **`updatePassword`** - Change Password
    - Validates old password
    - Updates to new password (auto-hashed by schema)

15. **`forgotPassword`** - Request Password Reset
    - Generates reset token (15 min expiry)
    - Sends reset email with link
    - Security: Always returns success (doesn't reveal if email exists)

16. **`resetPassword`** - Reset Password
    - Verifies reset token
    - Updates password
    - Handles token expiration

17. **`socialAuth`** - Social Authentication
    - Creates or logs in user via social provider
    - Generates JWT tokens

18. **`applyForInstructor`** - Apply for Instructor Role
    - Validates headline (10-100 chars) and bio (50-500 chars)
    - Auto-approves and promotes to instructor
    - Updates instructorHeadline, instructorBio, instructorStatus, role

19. **`toggleSellerStatus`** - Toggle Seller Status
    - Toggles isSeller flag
    - Returns updated user

20. **`updateSocialAccount`** - Add/Update Social Account
    - Adds or updates social account (platform, username)
    - Stores in socialAccounts array

21. **`removeSocialAccount`** - Remove Social Account
    - Removes social account by platform

22. **`updateWalletAddress`** - Update Wallet Address
    - Validates wallet address and provider
    - Stores walletAddress, walletProvider, walletPrivateKey (optional)
    - Sets walletConnectedAt timestamp

23. **`removeWalletAddress`** - Remove Wallet Address
    - Clears wallet information

---

### **2. Course Management Controllers**

#### **`course.controller.ts`** (650 lines)
**Purpose**: Complete course CRUD operations, instructor course management, and admin course management.

**Key Functions**:

1. **`createCourse`** - Create New Course
   - Validates required fields (name, price, demoUrl, courseData)
   - Handles thumbnail upload
   - Parses JSON fields (tags, benefits, prerequisites, courseData)
   - Creates course with createdBy reference

2. **`getAllCourses`** - Get All Courses (Public)
   - Returns formatted course list
   - Populates instructor info
   - Transforms to frontend format

3. **`getCourseById`** - Get Course Details (Public)
   - Returns full course details
   - Removes sensitive fields (videoUrl, links, suggestion, questions)
   - Populates instructor

4. **`getPurchasedCourseById`** - Get Purchased Course (Private)
   - Returns full course with all content
   - For enrolled students only

5. **`updateCourse`** - Update Course (Instructor)
   - Validates course ownership
   - Updates provided fields
   - Handles thumbnail update
   - Parses JSON fields

6. **`deleteCourse`** - Delete Course (Instructor)
   - Validates ownership
   - Deletes course

7. **`getInstructorCourses`** - Get Instructor's Courses
   - Returns all courses created by instructor
   - Populates instructor info

8. **`createTempProfessionalCourse`** - Create Test Course
   - Creates professional test course with full data
   - For testing purposes

9. **`getAdminCourses`** - Get All Courses (Admin)
   - Pagination support
   - Filtering by status, category, level, search
   - Returns statistics (total, active, pending, revenue, students, rating)
   - Returns unique categories and levels

10. **`updateCourseStatus`** - Update Course Status (Admin)
    - Updates course status (active, inactive, pending, rejected)

11. **`deleteCourseAdmin`** - Delete Course (Admin)
    - Admin can delete any course

---

### **3. Enrollment Controllers**

#### **`enrollment.controller.ts`** (618 lines)
**Purpose**: Course enrollment, order management, progress tracking, and balance checking.

**Key Functions**:

1. **`enrollInCourse`** - Enroll in Course
   - Validates course existence
   - Checks if already enrolled
   - Prevents self-enrollment
   - Validates wallet addresses (user and instructor)
   - Submits signed transaction to blockchain
   - Creates order with payment info
   - Splits payment (95% instructor, 5% admin)

2. **`getUserEnrolledCourses`** - Get User's Enrolled Courses
   - Returns all enrolled courses with details
   - Filters out deleted courses
   - Includes order information

3. **`checkEnrollment`** - Check Enrollment Status
   - Returns boolean isEnrolled
   - Returns enrollment details if enrolled

4. **`checkCourseAccess`** - Check Course Access
   - Determines access level (admin, instructor, student, none)
   - Returns access information

5. **`getAllOrders`** - Get All Orders (Admin)
   - Pagination support
   - Filtering by status, courseId, userId
   - Returns order statistics
   - Returns total revenue

6. **`getOrderDetails`** - Get Order Details
   - Returns order with course and user details
   - Validates access (admin or order owner)

7. **`updateOrderStatus`** - Update Order Status (Admin)
   - Updates order status (pending, completed, cancelled, refunded)
   - Sets completedAt if status is completed

8. **`markLectureComplete`** - Mark Lecture as Completed
   - Validates enrollment
   - Validates lecture exists
   - Adds to completedLectures array

9. **`checkUserBalance`** - Check Mintyn Balance
   - Checks user's wallet balance
   - Compares with course price
   - Returns hasEnough flag

10. **`getCourseProgress`** - Get Course Progress
    - Calculates completion percentage
    - Returns total and completed lectures

---

### **4. Review Controllers**

#### **`review.controller.ts`** (378 lines)
**Purpose**: Course review management with rating statistics.

**Key Functions**:

1. **`getCourseReviews`** - Get Course Reviews
   - Pagination support
   - Returns reviews with statistics
   - Calculates rating distribution (1-5 stars)
   - Returns average rating

2. **`createReview`** - Create Review
   - Validates course purchase
   - Prevents duplicate reviews
   - Creates review
   - Updates course rating statistics

3. **`updateReview`** - Update Review
   - Validates ownership
   - Updates rating and comment
   - Updates course statistics

4. **`deleteReview`** - Delete Review
   - Validates ownership
   - Deletes review
   - Updates course statistics

5. **`canUserReview`** - Check Review Eligibility
   - Returns canReview, hasPurchased, hasReviewed flags

6. **`getAdminReviews`** - Get All Reviews (Admin)
   - Pagination and filtering
   - Returns reviews with course info
   - Filters out deleted courses

7. **`deleteReviewAdmin`** - Delete Review (Admin)
   - Admin can delete any review

**Helper Functions**:
- **`updateCourseRatingStats`** - Updates course averageRating and totalReviews

---

### **5. Bookmark Controllers**

#### **`bookmark.controller.ts`** (185 lines)
**Purpose**: Course bookmarking functionality.

**Key Functions**:

1. **`addBookmark`** - Add Bookmark
   - Validates course existence
   - Prevents duplicate bookmarks
   - Creates bookmark with course details

2. **`removeBookmark`** - Remove Bookmark
   - Deletes bookmark by courseId

3. **`getUserBookmarks`** - Get User Bookmarks
   - Returns all bookmarks
   - Groups by category
   - Returns categorizedBookmarks object

4. **`checkBookmarkStatus`** - Check Bookmark Status
   - Returns boolean isBookmarked

5. **`getBookmarkCount`** - Get Bookmark Count
   - Returns total bookmark count

---

### **6. Note Controllers**

#### **`note.controller.ts`** (133 lines)
**Purpose**: Course note management for enrolled students.

**Key Functions**:

1. **`getCourseNote`** - Get Course Note
   - Validates enrollment
   - Returns user's note for course

2. **`saveCourseNote`** - Save/Update Note
   - Validates enrollment
   - Validates content (not empty)
   - Creates or updates note (upsert)

3. **`deleteCourseNote`** - Delete Note
   - Validates enrollment
   - Deletes note

---

### **7. Certificate Controllers**

#### **`certificate.controller.ts`** (368 lines)
**Purpose**: Certificate generation for completed courses.

**Key Functions**:

1. **`generateCertificate`** - Generate Certificate
   - Validates enrollment
   - Validates 100% completion
   - Generates certificate image using Canvas
   - Returns PNG image for download

2. **`checkCertificateEligibility`** - Check Eligibility
   - Returns eligible flag
   - Returns completion percentage

**Helper Functions**:
- **`generateCertificateImage`** - Creates modern certificate design
  - Dark theme with gradient background
  - Multi-layer borders
  - Decorative elements
  - Student name, course name, instructor signature
  - Completion date
  - Certificate ID
  - Verification badge

---

### **8. Instructor Controllers**

#### **`instructor.controller.ts`** (902 lines)
**Purpose**: Instructor statistics, dashboard, analytics, students, and earnings.

**Key Functions**:

1. **`getInstructorStats`** - Get Instructor Statistics
   - Returns: totalCourses, totalStudents, totalReviews, averageRating, totalRevenue

2. **`getInstructorDashboard`** - Get Dashboard Data
   - Time range filtering (last7days, last30days, last3months, etc.)
   - Overview stats (revenue, students, courses, orders, rating, completion rate)
   - Recent orders
   - Top courses by revenue
   - Monthly stats (12 months)

3. **`getInstructorAnalytics`** - Get Analytics Data
   - Revenue data for charts
   - Course performance metrics
   - Student demographics
   - Engagement metrics (watch time, completion time, discussion posts, assignments)

4. **`getInstructorStudents`** - Get Students Data
   - Total, active, new students
   - Top performing students
   - Recent enrollments
   - Course distribution
   - Student details with enrolled courses

5. **`getInstructorEarnings`** - Get Earnings Data
   - Overview (total, monthly, yearly earnings, pending payouts)
   - Monthly trends
   - Course earnings breakdown
   - Recent transactions
   - Payout history
   - Earnings by source

---

### **9. Admin Controllers**

#### **`admin.controller.ts`** (389 lines)
**Purpose**: Admin user and order management.

**Key Functions**:

1. **`getAdminUsers`** - Get All Users (Admin)
   - Returns users with statistics (totalCourses, totalSpent, totalEarnings)
   - Top spenders and top earners
   - User growth data (12 months)
   - Recent registrations
   - Users by role

2. **`getAdminOrders`** - Get All Orders (Admin)
   - Returns orders with populated user and course data
   - Order statistics (total, pending, completed, cancelled, refunded)
   - Revenue by month (12 months)
   - Orders by status
   - Top courses by revenue
   - Top instructors by revenue

---

### **10. Analytics Controllers**

#### **`analytics.controller.ts`** (433 lines)
**Purpose**: Platform-wide analytics and instructor-specific analytics.

**Key Functions**:

1. **`getAnalytics`** - Get Platform Analytics
   - Time range filtering
   - Overview (courses, users, revenue, rating, reviews)
   - Course performance
   - Category and level distribution
   - User demographics
   - Recent activity
   - Growth metrics
   - Engagement metrics

2. **`getInstructorAnalytics`** - Get Instructor Analytics
   - Similar to platform analytics but filtered by instructor's courses

**Helper Functions**:
- `getCourseStatistics` - Course stats aggregation
- `getUserStatistics` - User stats with demographics
- `getCategoryStatistics` - Category distribution
- `getLevelStatistics` - Level distribution
- `getRatingStatistics` - Rating aggregation
- `getRecentCourses` - Recent course activity
- `getTopCourses` - Top courses by rating
- `getUserGrowthData` - User growth over time
- `getCourseGrowthData` - Course growth over time

---

### **11. Role Controllers**

#### **`role.controller.ts`** (408 lines)
**Purpose**: Role management and role-based dashboards.

**Key Functions**:

1. **`getAllUsers`** - Get All Users with Role Filter
   - Pagination and search
   - Role filtering
   - Returns role statistics

2. **`updateUserRole`** - Update User Role
   - Validates role (user, instructor, admin, influencer)
   - Prevents self-role change
   - Updates user role

3. **`getUserProfile`** - Get User Profile
   - Returns user profile
   - Access control (admin or self)

4. **`updateUserProfile`** - Update User Profile
   - Updates profile fields
   - Access control

5. **`deleteUser`** - Delete User (Admin)
   - Prevents self-deletion
   - Deletes user

6. **`getRoleDashboard`** - Get Role-Based Dashboard
   - Returns dashboard based on user role
   - Admin, Instructor, User, Influencer dashboards

7. **`requestInstructorRole`** - Request Instructor Role
   - Submits instructor role request

**Helper Functions**:
- `getAdminDashboard` - Admin dashboard data
- `getInstructorDashboard` - Instructor dashboard data
- `getUserDashboard` - User dashboard data
- `getInfluencerDashboard` - Influencer dashboard data
- `getUserGrowthData` - User growth aggregation

---

### **12. Upload Controllers**

#### **`upload.controller.ts`** (132 lines)
**Purpose**: File upload management.

**Key Functions**:

1. **`uploadFile`** - Upload Single File
   - Handles file upload via Multer
   - Validates file type
   - Returns file URL
   - Supports: images, documents, archives, code files, design files, audio/video, fonts

2. **`uploadMultipleFiles`** - Upload Multiple Files
   - Handles multiple file uploads
   - Returns array of file URLs

**Configuration**:
- Storage: `/uploads/files/`
- File size limit: 100MB
- File type validation
- Unique filename generation

---

### **13. Auth0 Controllers**

#### **`auth0.controller.ts`** (245 lines)
**Purpose**: Auth0 social authentication integration.

**Key Functions**:

1. **`getAuth0LoginUrl`** - Get Auth0 Login URL
   - Generates Auth0 authorization URL
   - Supports provider parameter (google, github, twitter)

2. **`handleAuth0Callback`** - Handle Auth0 Callback
   - Exchanges code for tokens
   - Gets user info from Auth0
   - Creates or finds user
   - Links social account
   - Generates JWT tokens
   - Redirects to frontend

3. **`linkSocialAccount`** - Link Social Account
   - Links Auth0 account to existing user
   - Updates socialAccounts array

4. **`unlinkSocialAccount`** - Unlink Social Account
   - Removes social account

---

### **14. Influencer Controllers**

#### **`influencer.controller.ts`** (207 lines)
**Purpose**: Influencer analytics (view-only, user data only).

**Key Functions**:

1. **`getInfluencerAnalytics`** - Get Influencer Analytics
   - Returns user statistics only (no courses, orders, financial data)
   - Overview (total, active, new users)
   - Users by role
   - Verified vs unverified
   - Recent registrations
   - User growth (monthly and daily)
   - User demographics
   - Age distribution

**Note**: Influencer role has view-only access to user data, no edit/delete capabilities.

---

### **15. Bulk User Controllers**

#### **`bulkUser.controller.ts`** (345 lines)
**Purpose**: Bulk user creation for testing.

**Key Functions**:

1. **`createBulkUsers`** - Create Bulk Users
   - Creates 20 sample users (mix of users and instructors)
   - Handles duplicates
   - Returns created users and errors
   - Auto-verifies for testing

---

### **16. Dashboard Controllers**

#### **`dashboard/dashboard.controller.ts`** (687 lines)
**Purpose**: Dashboard statistics and top lists.

**Key Functions**:

1. **`getTotalUsers`** - Get Total Users Count
   - Returns total users with growth percentage

2. **`getTotalInstructors`** - Get Total Instructors Count
   - Returns total instructors with growth

3. **`getTotalCourses`** - Get Total Courses Count
   - Returns total courses with growth

4. **`getTotalProducts`** - Get Total Products Count
   - Returns approved/active products with growth

5. **`getTotalServices`** - Get Total Services Count
   - Returns approved/active services with growth

6. **`getAvgRating`** - Get Average Rating
   - Calculates average across courses, products, services

7. **`getTopInstructors`** - Get Top Instructors
   - Returns top instructors by students enrolled
   - Includes: rating, students, courses, revenue, badges

8. **`getTopProducts`** - Get Top Products
   - Returns top products by sales count
   - Includes: rating, reviews, downloads, seller info

9. **`getTopServices`** - Get Top Services
   - Returns top services by order count
   - Includes: rating, reviews, orders, seller info

10. **`getTopSellers`** - Get Top Sellers
    - Returns top sellers by earnings
    - Includes: products, services, sales, earnings, level

11. **`getTrendingCategories`** - Get Trending Categories
    - Combines categories from courses, products, services
    - Returns top 6 categories

12. **`getRecentActivity`** - Get Recent Activity
    - Returns recent course enrollments, product purchases, service orders, reviews
    - Formats with time ago

---

### **17. Governance Controllers**

#### **`governance/proposal.controller.ts`** (813+ lines)
**Purpose**: Governance proposal creation and management.

**Key Functions**:

1. **`createProposal`** - Create Proposal
   - Validates all required fields
   - Validates dates (start > now, end > start)
   - Checks user wallet balance
   - Creates proposal on blockchain
   - Stores proposal in database
   - Returns proposal with blockchain info

**Fields**:
- title, category, summary, detailedDescription
- expectedImpact, implementationPlan, timeline
- resourcesNeeded, attachments, startDate, endDate
- proposalFee, blockchainAddress, blockchainTx

#### **`governance/vote.controller.ts`** (449+ lines)
**Purpose**: Voting on governance proposals.

**Key Functions**:

1. **`castVote`** - Cast Vote
   - Validates vote choice (yes, no, abstain)
   - Validates proposal exists and is active
   - Prevents voting on own proposal
   - Validates voting period
   - Prevents duplicate votes
   - Creates vote record
   - Updates proposal vote counts

---

### **18. Marketplace Controllers**

#### **`marketplace/marketplaceProduct.controller.ts`** (496+ lines)
**Purpose**: Marketplace product CRUD operations.

**Key Functions**:

1. **`createMarketplaceProduct`** - Create Product
   - Validates seller status
   - Handles image uploads
   - Parses JSON fields
   - Calculates discount
   - Creates product with seller reference

**Fields**:
- title, description, price, originalPrice, category
- tags, features, whatIncluded, requirements
- specifications, digitalDelivery, updates, support
- fileFormat, license, images, thumbnailImage

---

## 🔐 **Security Features**

### **Authentication & Authorization**
- JWT-based authentication (access + refresh tokens)
- HTTP-only cookies for token storage
- Role-based access control (user, instructor, admin, influencer)
- Seller status validation
- Ownership validation (course, review, order)

### **Input Validation**
- Email format validation
- Solana wallet address validation
- Password strength (minimum 6 characters)
- Required field validation
- Date validation
- File type validation

### **Error Handling**
- Centralized error handling via ErrorHandler
- CatchAsyncError wrapper for async functions
- User-friendly error messages
- Detailed error logging

---

## 📊 **Data Flow Patterns**

### **Typical Request Flow**:
1. Request → Middleware (auth, rate limit)
2. Controller → Validation
3. Controller → Database Query
4. Controller → Business Logic
5. Controller → Response

### **Blockchain Integration**:
1. Validate wallet address
2. Check balance
3. Create transaction
4. Submit to blockchain
5. Store transaction signature
6. Update database

---

## 🎯 **Key Observations**

### **Strengths**:
✅ Comprehensive CRUD operations
✅ Well-structured error handling
✅ Blockchain integration
✅ Role-based access control
✅ Pagination support
✅ Filtering and search
✅ Statistics and analytics
✅ File upload handling

### **Areas for Improvement**:
⚠️ Some controllers are very large (1000+ lines)
⚠️ Business logic mixed with controllers (could use service layer more)
⚠️ Some duplicate code (could be extracted to utilities)
⚠️ Missing user preferences API
⚠️ No data export functionality
⚠️ Limited caching implementation

---

## 📝 **Summary Statistics**

- **Total Controllers**: 18+ controller files
- **Total Functions**: 100+ controller functions
- **Lines of Code**: ~8,000+ lines across all controllers
- **Main Categories**: User, Course, Enrollment, Review, Bookmark, Note, Certificate, Instructor, Admin, Analytics, Role, Upload, Auth0, Influencer, Bulk, Dashboard, Governance, Marketplace

---

**Last Updated**: Complete controllers analysis
**Total Endpoints**: 100+ API endpoints
**Authentication Required**: Most endpoints require authentication
**Role-Based Access**: Admin, Instructor, User, Influencer roles supported

