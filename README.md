# 0xMintyn - Universal Basic Income Platform

A comprehensive educational platform with integrated governance, marketplace, and UBI distribution features built with modern web technologies.

## Table of Contents

- [Backend Documentation](#backend-documentation)
  - [Technology Stack](#technology-stack)
  - [API Architecture](#api-architecture)
  - [Authentication & Authorization](#authentication--authorization)
  - [Middleware Stack](#middleware-stack)
  - [Role-Based Access Control](#role-based-access-control)
  - [Protected Routes](#protected-routes)
- [Frontend Documentation](#frontend-documentation)
  - [Technology Stack](#technology-stack-1)
  - [Pages/Routes Structure](#pagesroutes-structure)
  - [Components Architecture](#components-architecture)
  - [Authentication Flow](#authentication-flow)
- [User Management & Permissions](#user-management--permissions)
  - [Admin Capabilities](#admin-capabilities)
  - [Instructor Capabilities](#instructor-capabilities)
  - [Regular User Capabilities](#regular-user-capabilities)
- [Digital Marketplace](#digital-marketplace)
  - [Marketplace Overview](#marketplace-overview)
  - [Digital Products](#digital-products)
  - [Services](#services)
  - [User Seller Status](#user-seller-status)
  - [Marketplace Components](#marketplace-components)
  - [Digital Library](#digital-library)
- [UI/UX Details](#uiux-details)
  - [Layout Structure](#layout-structure)
  - [User Flows](#user-flows)
  - [State Management](#state-management)
- [Additional Technical Details](#additional-technical-details)
  - [Security Measures](#security-measures)
  - [Database Schema](#database-schema)
  - [Deployment & Environment](#deployment--environment)

---

## Backend Documentation

### Technology Stack

**Core Technologies:**
- **Node.js**: v18.x
- **TypeScript**: v5.8.2
- **Express.js**: v4.21.2
- **MongoDB**: v8.4.5 (with Mongoose ODM)
- **Package Manager**: npm

**Key Dependencies:**
- **Authentication**: JWT (jsonwebtoken), bcryptjs
- **File Upload**: Multer
- **Email**: Nodemailer, EJS templates
- **Real-time**: Socket.io
- **Security**: express-rate-limit, cors, helmet
- **Utilities**: axios, node-cron, canvas

### API Architecture

The API follows RESTful conventions with versioned endpoints (`/api/v1/`). All routes are organized by feature modules.

#### Complete API Endpoints

**User Management (`/api/v1/user`)**
- `POST /register` - User registration
- `POST /activate-user` - Account activation
- `POST /login` - User login
- `GET /logout` - User logout (Protected)
- `GET /users` - Get all users (Public)
- `GET /refreshtoken` - Refresh access token
- `GET /me` - Get current user info (Protected)
- `GET /instructor-stats/:instructorId` - Get instructor statistics (Public)
- `PUT /update-user-info` - Update user profile (Protected)
- `PUT /update-username` - Update username (Protected)
- `PUT /change-password` - Change password (Protected)
- `POST /social-auth` - Social authentication
- `PUT /update-user-avatar` - Update profile picture (Protected)
- `PUT /update-user-banner` - Update banner picture (Protected)
- `POST /apply-instructor` - Apply for instructor role (Protected)
- `PUT /toggle-seller-status` - Toggle user seller status (Protected)

**Course Management (`/api/v1/course`)**
- `POST /create` - Create course (Instructor/Admin only)
- `GET /` - Get all courses (Public)
- `GET /:id` - Get course by ID (Public)
- `GET /enrolled-course/:id` - Get enrolled course details (Protected)
- `GET /instructor/my-courses` - Get instructor's courses (Instructor/Admin only)
- `PUT /:id` - Update course (Instructor/Admin only)
- `DELETE /:id` - Delete course (Instructor/Admin only)
- `POST /create-professional` - Create professional course (Protected)
- `GET /admin/all` - Get all courses for admin (Admin only)
- `PUT /admin/:id/status` - Update course status (Admin only)
- `DELETE /admin/:id` - Delete course (Admin only)

**Enrollment (`/api/v1/enrollment`)**
- `POST /enroll/:courseId` - Enroll in course (Protected)
- `GET /my-courses` - Get user's enrolled courses (Protected)
- `GET /check/:courseId` - Check enrollment status (Protected)
- `GET /access/:courseId` - Check course access (Protected)
- `POST /progress/:courseId/:lectureId/complete` - Mark lecture complete (Protected)
- `GET /progress/:courseId` - Get course progress (Protected)

**Admin Management (`/api/v1/admin`)**
- `GET /users` - Get admin users data (Admin only)

**Instructor Management (`/api/v1/instructor`)**
- `GET /instructor-stats/:instructorId` - Get instructor statistics (Public)
- `GET /instructor/dashboard` - Get instructor dashboard (Protected)
- `GET /instructor/analytics` - Get instructor analytics (Protected)
- `GET /instructor/students` - Get instructor students (Protected)
- `GET /instructor/earnings` - Get instructor earnings (Protected)

**Governance (`/api/v1/proposal`, `/api/v1/vote`)**
- `GET /stats` - Get governance statistics (Public)
- `GET /top` - Get top proposals (Public)
- `GET /all` - Get all proposals (Public)
- `GET /:proposalId` - Get proposal by ID (Public)
- `POST /create` - Create proposal (Protected)
- `GET /user/:userId` - Get user proposals (Protected)
- `PATCH /:proposalId/status` - Update proposal status (Admin only)
- `DELETE /:proposalId` - Delete proposal (Admin only)

**Additional Routes:**
- File upload (`/api/v1/upload`)
- Video streaming (`/api/v1/stream`)
- Analytics (`/api/v1/analytics`)
- Role management (`/api/v1/role`)
- Certificates (`/api/v1/certificate`)
- Bookmarks (`/api/v1/bookmark`)
- Reviews (`/api/v1/review`)
- Notes (`/api/v1/note`)

### Authentication & Authorization

**Authentication Method**: JWT (JSON Web Tokens) with refresh token mechanism

**Token Configuration:**
- **Access Token**: 1 hour lifespan
- **Refresh Token**: 3 days lifespan
- **Token Storage**: HTTP-only cookies with secure flags

**Token Generation & Validation:**
```typescript
// Access token generation
userSchema.methods.SignAccessToken = function (): string {
    return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || "", { expiresIn: '1h' });
};

// Refresh token generation
userSchema.methods.SignRefreshToken = function (): string {
    return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || "", { expiresIn: '3d' });
};
```

**Cookie Management:**
- **SameSite**: 'none' (for cross-origin requests)
- **Secure**: true (HTTPS only)
- **HttpOnly**: true (prevents XSS)
- **Automatic refresh**: Middleware handles token refresh automatically

**Authentication Middleware:**
The `authWithRefresh` middleware provides:
- Automatic token validation
- Token refresh on expiration
- User context injection
- Error handling for invalid/expired tokens

### Middleware Stack

**Order of Execution:**
1. **Body Parser** - Parse JSON payloads (50MB limit)
2. **Cookie Parser** - Parse cookies
3. **CORS** - Cross-origin resource sharing
4. **Static Files** - Serve uploaded files
5. **Rate Limiting** - Request throttling
6. **Route Handlers** - API endpoints
7. **Error Middleware** - Global error handling

**Custom Middleware:**

**Rate Limiting:**
- General: 1000 requests per 15 minutes
- Auth endpoints: 200 requests per 15 minutes
- Development mode: Rate limiting disabled

**Authentication Middleware:**
- `authWithRefresh` - Enhanced auth with auto-refresh
- `isAuthenticated` - Basic authentication check
- `updateAccessTokenMiddleware` - Token refresh handler

**Role-Based Middleware:**
- `requireRole(roles[])` - Generic role checker
- `requireAdmin` - Admin-only access
- `requireInstructorOrAdmin` - Instructor or admin access
- `requireAuth` - Any authenticated user

**Error Handling:**
- Global error middleware
- Custom error classes
- Structured error responses
- Development vs production error details

### Role-Based Access Control

**User Roles:**
1. **User** (`user`) - Default role for registered users
2. **Instructor** (`instructor`) - Can create and manage courses
3. **Admin** (`admin`) - Full platform access and management

**Permissions Matrix:**

| Feature | User | Instructor | Admin |
|---------|------|------------|-------|
| View courses | ✅ | ✅ | ✅ |
| Enroll in courses | ✅ | ✅ | ✅ |
| Create courses | ❌ | ✅ | ✅ |
| Manage own courses | ❌ | ✅ | ✅ |
| Manage all courses | ❌ | ❌ | ✅ |
| User management | ❌ | ❌ | ✅ |
| System analytics | ❌ | ❌ | ✅ |
| Governance proposals | ✅ | ✅ | ✅ |
| Approve/reject proposals | ❌ | ❌ | ✅ |

**Role Assignment:**
- Users can apply for instructor role via `/apply-instructor`
- Admin approval required for role changes
- Role verification in all protected endpoints

**Role Verification Process:**
```typescript
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ErrorHandler("Authentication required", 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ErrorHandler(`Access denied. Required roles: ${roles.join(', ')}`, 403));
    }
    next();
  };
};
```

### Protected Routes

**Authentication Required:**
- All user profile operations
- Course enrollment
- Progress tracking
- Instructor dashboard
- Admin operations

**Role-Specific Protection:**
- **Admin Only**: User management, system analytics, course moderation
- **Instructor/Admin**: Course creation, course management
- **All Authenticated**: Profile updates, enrollment, progress tracking

**Implementation:**
Routes are protected using middleware chains:
```typescript
router.post('/create', 
  updateAccessTokenMiddleware, 
  isAuthenticated, 
  requireInstructorOrAdmin, 
  upload.single("thumbnail"), 
  createCourse
);
```

---

## Frontend Documentation

### Technology Stack

**Core Framework:**
- **Next.js**: v15.5.2 (App Router)
- **React**: v19.1.1
- **TypeScript**: v5.x

**State Management:**
- **Redux Toolkit**: v2.6.1
- **React Query**: v5.69.0 (@tanstack/react-query)
- **Context API**: Custom auth and theme contexts

**UI & Styling:**
- **Tailwind CSS**: v3.4.1
- **Radix UI**: Complete component library
- **Lucide React**: Icon library
- **Motion**: Animation library

**Form Handling:**
- **React Hook Form**: v7.54.2
- **Zod**: Schema validation
- **@hookform/resolvers**: Form validation

**Additional Libraries:**
- **Next Auth**: v4.24.11 (Social authentication)
- **Axios**: HTTP client with interceptors
- **Date-fns**: Date manipulation

### Pages/Routes Structure

**Route Organization:**
```
src/app/
├── (login)/                    # Login route group
│   └── login/
├── (registration)/             # Registration route group
│   └── registration-form/
├── (verification)/             # Email verification
│   └── verification/
├── (userdashboard)/            # Protected dashboard routes
│   ├── admin/                  # Admin pages
│   ├── analytics/              # Analytics dashboard
│   ├── bookmarks/              # User bookmarks
│   ├── courses/                # Course listing
│   ├── create-course/          # Course creation
│   ├── dashboard/              # Main dashboard
│   ├── educationhub/           # Education hub
│   ├── governance/             # Governance features
│   ├── instructor/             # Instructor pages
│   ├── my-courses/             # User's courses
│   ├── myprofile/              # User profile
│   ├── profile/                # Profile management
│   ├── settings/               # User settings
│   └── users/                  # User management
└── page.tsx                    # Landing page
```

**Route Protection:**
- **Public Routes**: Login, registration, verification, landing page
- **Protected Routes**: All dashboard routes require authentication
- **Role-Based Routes**: Admin, instructor, and user-specific pages

### Components Architecture

**Component Hierarchy:**

**Layout Components:**
- `AdvancedLayout.tsx` - Main layout wrapper
- `AdvancedSidebar.tsx` - Navigation sidebar
- `Header/Header.tsx` - Top navigation
- `LayoutContent.client.tsx` - Client-side layout logic

**Authentication Components:**
- `SocialAuth/` - Social login providers
- `RoleProtected.tsx` - Role-based route protection
- `CourseAccessGuard.tsx` - Course access validation

**Dashboard Components:**
- `RoleBasedDashboard.tsx` - Dynamic dashboard based on user role
- `Dashboard/` - Dashboard-specific components
- `RoleBasedNav.tsx` - Role-based navigation

**Course Components:**
- `course/` - Course-related components (9 files)
- `EducationHub/` - Education hub components
- `InstructorApplicationModal.tsx` - Instructor application
- `NotesSection.tsx` - Course notes
- `ReviewSection.tsx` - Course reviews

**Feature Components:**
- `Dap/` - Decentralized Autonomous Platform features
- `Governance/` - Governance and voting
- `MyProfile/` - Profile management (11 components)

**UI Components:**
- `ui/` - Reusable UI components (25 components)
- `Spinner.tsx` - Loading spinner
- `Settings/` - Settings components

**CRUD Operations:**
- **Create**: Course creation, user registration, proposal creation
- **Read**: Course listing, user profiles, analytics
- **Update**: Profile updates, course modifications, settings
- **Delete**: Course deletion, content removal

**Form Components:**
- Registration forms with validation
- Course creation forms with file upload
- Profile update forms
- Settings forms with password change

**List/Table Components:**
- Course grids with filtering
- User management tables
- Analytics data tables
- Order history lists

**Modal/Dialog Components:**
- Instructor application modal
- Course preview modals
- Confirmation dialogs
- Settings modals

### Authentication Flow

**Login Components:**
- `(login)/login/page.tsx` - Login form
- `SocialAuth/` - Social authentication providers
- Form validation with React Hook Form and Zod

**Token Storage:**
- **Frontend**: localStorage for user data and access token
- **Backend**: HTTP-only cookies for secure token storage
- **Automatic Refresh**: Axios interceptors handle token refresh

**Token Refresh Implementation:**
```typescript
// Automatic token refresh in axios interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Attempt token refresh
      const refreshResponse = await axios.get('/refreshtoken');
      // Retry original request with new token
    }
  }
);
```

**Logout Mechanism:**
- Clear localStorage
- Clear HTTP-only cookies via API call
- Redirect to login page
- Reset Redux state

**Protected Route Implementation:**
- `useProtected` hook for route protection
- `RoleProtected` component for role-based access
- Automatic redirects for unauthorized access

---

## User Management & Permissions

### Admin Capabilities

**User Management:**
- View all registered users
- Manage user roles (promote to instructor/admin)
- User account moderation
- Bulk user operations
- User analytics and reporting

**Content Moderation:**
- Approve/reject courses
- Manage course categories
- Content quality control
- Remove inappropriate content

**System Settings:**
- Platform configuration
- Email templates
- System maintenance

**Analytics & Reporting:**
- User growth metrics
- Course performance analytics
- System health monitoring

### Instructor Capabilities

**Becoming an Instructor:**
- Apply through `/apply-instructor` endpoint
- Admin approval required
- Status tracking (pending/approved/rejected)

**Content Creation:**
- Create and publish courses
- Upload course materials (videos, documents)
- Manage course content structure

**Student Management:**
- View enrolled students
- Track student progress
- Communicate with students
- Grade assignments

**Course Management:**
- Edit course content
- Update course information
- Manage course sections and videos
- Set course prerequisites

**Analytics:**
- View course performance metrics
- Track student engagement
- Access instructor-specific analytics

### Regular User Capabilities

**Profile Management:**
- Update personal information
- Change password
- Upload profile picture and banner
- Manage account settings

**Content Access:**
- Browse available courses
- Enroll in courses
- Access enrolled course content

**Learning Features:**
- Track learning progress
- Take notes during courses
- Bookmark favorite content
- Leave course reviews

**Social Features:**
- Participate in governance
- Create and vote on proposals
- Community engagement

---

## Digital Marketplace

### Marketplace Overview

The 0xMintyn platform features a comprehensive digital marketplace that allows users to buy and sell digital products and services. The marketplace is designed exclusively for digital goods, eliminating the need for physical shipping and logistics.

**Key Features:**
- **Digital-Only Products**: Templates, design assets, code, e-books, software, and media files
- **Service Marketplace**: Fiverr-style services for digital work
- **Instant Access**: Immediate download and access to purchased items
- **Digital Library**: Centralized management of all purchased digital products
- **Seller System**: Users can become sellers and monetize their digital creations

### Digital Products

**Product Categories:**
- **Website Templates**: HTML/CSS templates, responsive designs
- **Design Assets**: UI/UX kits, graphics, icons, illustrations
- **Code Templates**: React Native apps, frameworks, boilerplates
- **E-books & Guides**: PDF documents, educational materials
- **Software & Tools**: Applications, plugins, extensions
- **Stock Media**: Photos, videos, audio files
- **Fonts & Typography**: Font collections, typefaces
- **3D Assets**: Models, textures, animations

**Product Information:**
- File format indicators (HTML/CSS, Figma/Sketch, PDF, etc.)
- File size information
- License types (Personal, Commercial, Extended, Standard)
- Download limits and access duration
- Instant download messaging
- Preview capabilities

**Sample Digital Products:**
1. Premium Website Template Pack (HTML/CSS, 25.4 MB, Commercial License)
2. Professional UI/UX Design Kit (Figma/Sketch, 12.8 MB, Extended License)
3. Stock Photo Collection - Business (JPG/PNG, 45.2 MB, Standard License)
4. Cryptocurrency Trading eBook (PDF, 8.7 MB, Personal License)
5. React Native App Template (React Native, 156.3 MB, Commercial License)
6. Premium Font Collection (TTF/OTF, 12.1 MB, Extended License)

### Services

**Service Categories:**
- **Design & Creative**: Logo design, branding, graphics
- **Web Development**: Frontend, backend, full-stack development
- **Writing & Translation**: Content writing, copywriting, translation
- **Digital Marketing**: SEO, social media, advertising
- **Tutoring & Education**: Online tutoring, mentoring
- **Photography**: Photo editing, retouching
- **Music & Audio**: Audio editing, music production
- **Business Services**: Consulting, strategy, planning

**Service Features:**
- Service packages (Basic, Standard, Premium)
- Seller profiles with ratings and reviews
- Delivery timelines and revision policies
- Service showcases with examples
- Order management and communication

### User Seller Status

**New Feature: `isSeller` Field**

The platform now includes a seller status system that allows users to become sellers in the marketplace.

**User Model Updates:**
```typescript
interface IUser {
  // ... existing fields
  isSeller: boolean; // New field with default: false
  // ... other fields
}
```

**Seller Status Management:**
- **Default Status**: All new users have `isSeller: false`
- **Toggle Functionality**: Users can activate/deactivate seller status
- **API Endpoint**: `PUT /api/v1/user/toggle-seller-status`
- **Authentication Required**: Protected route requiring user authentication

**Backend Implementation:**
```typescript
// Toggle seller status endpoint
export const toggleSellerStatus = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const user = await UserModel.findById(userId);
  
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Toggle the isSeller status
  user.isSeller = !user.isSeller;
  await user.save();

  res.status(200).json({
    success: true,
    message: user.isSeller ? "Seller status activated successfully" : "Seller status deactivated successfully",
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      role: user.role,
      isVerified: user.isVerified,
      isSeller: user.isSeller,
      avatar: user.avatar,
      banner: user.banner,
      bio: user.bio
    }
  });
});
```

**Frontend Integration:**
- Updated all User interfaces to include `isSeller: boolean`
- AuthContext, Admin pages, Profile pages, and hooks updated
- Ready for seller-specific UI features and access control

### Marketplace Components

**Core Components:**

**1. MarketplaceHeader**
- Navigation with Products/Services tabs
- Search functionality with filters
- User account dropdown
- Shopping cart indicator

**2. ProductGrid**
- Grid and list view options
- Digital product cards with file information
- File format badges and size indicators
- License type indicators
- "Get Instant Access" buttons

**3. ServiceGrid**
- Service listings with packages
- Seller information and ratings
- Delivery timelines
- Service previews

**4. CategoryGrid**
- Digital product categories
- Service categories
- Category-specific filtering

**5. HeroSection**
- Rotating banners for featured content
- Marketplace statistics
- Call-to-action buttons

**6. FeaturedSection**
- Trending products and services
- Best sellers and new arrivals
- Statistics and metrics

**7. SearchFilters**
- Advanced filtering options
- File format filters
- License type filters
- Price range filters
- Category filters

**8. QuickViewModal**
- Product preview without leaving the page
- Digital product information
- Instant access messaging

**9. Digital Library**
- All purchased digital products
- Download tracking with limits
- License information
- Re-download capabilities
- Purchase history

### Digital Library

**Features:**
- **Grid and List Views**: Multiple viewing options for purchased items
- **Search and Filter**: Find specific products by type, format, or date
- **Download Management**: Track download counts and limits
- **License Information**: View license types and terms
- **Purchase History**: Complete record of all digital purchases
- **Re-download**: Access purchased items multiple times (within limits)
- **Favorites**: Mark frequently used items
- **Status Tracking**: Monitor expired or limited access items

**Library Page Structure:**
```
/marketplace/library
├── Header with search and filters
├── View toggle (Grid/List)
├── Product cards with:
│   ├── Product image/preview
│   ├── File format and size
│   ├── License information
│   ├── Download count/limit
│   ├── Purchase date
│   └── Download button
└── Status indicators (Active/Expired)
```

**Digital Rights Management:**
- Download limit enforcement
- License key generation (for software)
- Access expiration dates (for time-limited licenses)
- Watermarking options (for images/videos)
- Commercial vs. personal license tracking

**Integration with 0xMintyn Platform:**
- **Educational Integration**: Easy conversion of educational resources to digital products
- **UBI Integration**: Use UBI tokens/credits for digital purchases
- **Community Discounts**: Special pricing for community members
- **Separate from Education Hub**: No courses in marketplace (kept separate as requested)

**Technical Implementation:**
- **No Physical Logistics**: Instant downloads, no shipping addresses
- **File Management**: Secure file storage and delivery
- **License Tracking**: Database management of license types and limits
- **Download Analytics**: Tracking of download patterns and usage
- **Payment Integration**: Support for multiple payment methods
- **Security**: Secure file access and download protection

---

## UI/UX Details

### Layout Structure

**Header/Navigation:**
- Responsive navigation bar
- User profile dropdown
- Role-based menu items
- Search functionality
- Theme toggle

**Sidebar/Menu:**
- Collapsible sidebar navigation
- Role-based menu items
- Quick access to main features
- Responsive design for mobile

**Footer:**
- Platform information
- Legal links
- Social media links
- Contact information

**Responsive Design:**
- Mobile-first approach
- Tailwind CSS responsive utilities
- Adaptive layouts for all screen sizes
- Touch-friendly interface

### User Flows

**Registration Process:**
1. User fills registration form
2. Email verification sent
3. Account activation required
4. Welcome to dashboard

**Login Process:**
1. User enters credentials
2. JWT tokens generated
3. User redirected to role-based dashboard
4. Automatic token refresh setup

**Main User Journeys:**
- **Student**: Browse → Enroll → Learn → Review
- **Instructor**: Apply → Create → Manage → Analyze
- **Admin**: Monitor → Manage → Configure → Report

**Role-Specific Dashboards:**
- **User Dashboard**: Course recommendations, progress tracking
- **Instructor Dashboard**: Course management, student analytics
- **Admin Dashboard**: System overview, user management

### State Management

**Global State (Redux):**
- User authentication state
- API cache management
- Global UI state
- Error handling

**Local Component State:**
- Form data
- UI interactions
- Component-specific data
- Loading states

**API Integration:**
- RTK Query for server state
- Automatic caching and synchronization
- Optimistic updates
- Error handling and retry logic

**Loading States:**
- Skeleton loaders
- Progress indicators
- Loading spinners
- Error boundaries

---

## Additional Technical Details

### Security Measures

**Input Validation:**
- Zod schema validation on frontend
- Mongoose schema validation on backend
- Sanitization of user inputs
- File upload validation

**XSS Protection:**
- HTTP-only cookies
- Content Security Policy
- Input sanitization
- Safe HTML rendering

**CSRF Protection:**
- SameSite cookie attributes
- CSRF tokens for state-changing operations
- Origin validation

**Rate Limiting:**
- Express rate limiting middleware
- Different limits for different endpoints
- IP-based throttling
- Development mode bypass

**Data Encryption:**
- Password hashing with bcrypt
- JWT token signing
- HTTPS enforcement
- Secure cookie settings

### Database Schema

**Models/Collections:**

**User Model:**
```typescript
interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  role: 'user' | 'instructor' | 'admin';
  avatar: string;
  bio: string;
  instructorStatus: 'pending' | 'approved' | 'rejected';
  isVerified: boolean;
  isSeller: boolean; // New field for marketplace seller status
  // ... additional fields
}
```

**Course Model:**
```typescript
interface ICourse {
  name: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  createdBy: ObjectId;
  courseData: Section[];
  reviews: Review[];
  averageRating: number;
  // ... additional fields
}
```


**Proposal Model (Governance):**
```typescript
interface IProposal {
  title: string;
  category: string;
  proposerId: ObjectId;
  summary: string;
  votingOptions: { yes: number; no: number; abstain: number };
  status: 'Draft' | 'Active' | 'Passed' | 'Rejected';
  // ... additional fields
}
```

**Relationships:**
- Users → Courses (one-to-many)
- Courses → Reviews (one-to-many)
- Users → Proposals (one-to-many)

**Indexes:**
- User email and username (unique)
- Course createdBy and status
- Proposal status and createdAt

### Deployment & Environment

**Environment Variables:**

**Backend (.env):**
```bash
# Server Configuration
PORT=8000
SERVER_URL=https://appbackend.0xmintyn.com

# Database
DB_URI=mongodb://127.0.0.1:27017/0xmintyn

# JWT Secrets
ACCESS_TOKEN=your_access_token_secret
REFRESH_TOKEN=your_refresh_token_secret
ACTIVATION_SECRET=your_activation_secret


# Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
SMTP_FROM="0xMintyn <no-reply@0xmintyn.com>"
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_SERVER_URI=https://appbackend.0xmintyn.com
```

**Development Setup:**
1. Clone repository
2. Install dependencies (`npm install`)
3. Set up environment variables
4. Start MongoDB
5. Run backend (`npm run dev`)
6. Run frontend (`npm run dev`)

**Production Deployment:**
- Backend: Node.js server with PM2
- Frontend: Next.js static export or Vercel
- Database: MongoDB Atlas or self-hosted
- CDN: For static assets

**Build Commands:**
```bash
# Backend
npm run build    # TypeScript compilation
npm start        # Production server

# Frontend
npm run build    # Next.js build
npm start        # Production server
```

---

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- MongoDB 4.4 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd 0xmintyn-Main
```

2. **Install backend dependencies**
```bash
cd Backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../Frontend
npm install
```

4. **Set up environment variables**
```bash
# Copy example files
cp Backend/env.example Backend/.env
cp Frontend/env.local.example Frontend/.env.local

# Edit the files with your configuration
```

5. **Start the development servers**
```bash
# Terminal 1 - Backend
cd Backend
npm run dev

# Terminal 2 - Frontend
cd Frontend
npm run dev
```

6. **Access the application**
- Frontend: https://app.0xmintyn.com
- Backend API: https://appbackend.0xmintyn.com

### Default Admin Account
After setting up the database, create an admin user through the registration endpoint or directly in the database.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
