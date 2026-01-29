# Backend Implementation Summary
## Startup & Contributor Features - Complete Backend

---

## ✅ **COMPLETED BACKEND STRUCTURE**

### **1. Database Models**

#### **Contributor Models**
- **Location:** `Backend/models/contributor/ContributorProfile.model.ts`
- **Schema Fields:**
  - `userId` (ObjectId, ref: User, unique)
  - `bio` (String, 50-500 chars, required)
  - `skills` (Array, 1-10 items, required)
  - `hourlyRate` (Number, optional)
  - `availability` (Enum: available/busy/unavailable)
  - `portfolio` (Array of projects with images, links, technologies)
  - `certifications` (Array with name, organization, url, issueDate)
  - `ratings` (Object: average, count)
  - `completedProjects` (Number)
  - `isVerified` (Boolean)
  - Timestamps

#### **Startup Models**
- **Location:** `Backend/models/startup/Startup.model.ts`
- **Schema Fields:**
  - `userId` (ObjectId, ref: User, unique)
  - `companyName` (String, unique, max 100 chars)
  - `logo` (String, optional)
  - `description` (String, 100-2000 chars, required)
  - `industry` (String, required)
  - `stage` (Enum: ideation/execute/scale)
  - `websiteUrl` (String, optional)
  - `socialMedia` (Object: twitter, linkedin, github)
  - `founderBio` (String, 50-500 chars, required)
  - `previousExperience` (String, optional)
  - `businessPlan` (Object: problem, solution, targetMarket, competitiveAdvantage)
  - `fundingStatus` (Enum: pending/approved/rejected/active)
  - `totalFunding` (Number)
  - `currentBalance` (Number)
  - `teamSize` (Number)
  - `completedMilestones` (Number)
  - `isVerified` (Boolean)
  - Timestamps

- **Location:** `Backend/models/startup/StartupApplication.model.ts`
- **Schema Fields:** Same as Startup model plus:
  - `status` (Enum: pending/approved/rejected)
  - `rejectionReason` (String, optional)
  - `reviewedBy` (ObjectId, ref: User)
  - `reviewedAt` (Date)

- **Location:** `Backend/models/startup/JobPosting.model.ts`
- **Schema Fields:**
  - `startupId` (ObjectId, ref: Startup)
  - `title` (String, required, max 200 chars)
  - `description` (String, 50-5000 chars, required)
  - `requiredSkills` (Array, required)
  - `compensationType` (Enum: milestone-based/fixed/hourly)
  - `compensationAmount` (Number, required)
  - `expectedDuration` (String, optional)
  - `applicationDeadline` (Date, optional)
  - `status` (Enum: open/closed/filled)
  - `applicantCount` (Number)
  - `postedAt` (Date)
  - Timestamps

#### **Hiring Models**
- **Location:** `Backend/models/hiring/HiringApplication.model.ts`
- **Schema Fields:**
  - `startupId` (ObjectId, ref: Startup)
  - `contributorId` (ObjectId, ref: ContributorProfile)
  - `jobPostingId` (ObjectId, ref: JobPosting, optional)
  - `role` (String, required)
  - `projectDescription` (String, min 50 chars, required)
  - `compensationType` (Enum: milestone-based/fixed/hourly)
  - `compensationAmount` (Number, required)
  - `startDate` (Date, optional)
  - `expectedDuration` (String, optional)
  - `additionalNotes` (String, optional)
  - `coverLetter` (String, optional, max 1000 chars)
  - `selectedPortfolio` (Array of ObjectIds, optional)
  - `status` (Enum: invited/applied/hired/rejected/declined/withdrawn)
  - `rejectionReason` (String, optional)
  - `invitedAt` (Date)
  - `appliedAt` (Date, optional)
  - `acceptedAt` (Date, optional)
  - `declinedAt` (Date, optional)
  - `rejectedAt` (Date, optional)
  - Timestamps

---

### **2. Controllers**

#### **Contributor Controller**
- **Location:** `Backend/controllers/contributor/contributor.controller.ts`
- **Functions:**
  - `applyAsContributor` - Create contributor profile (auto-approve)
  - `getContributorProfile` - Get own profile
  - `getContributorById` - Get public profile by ID
  - `getAllContributors` - Public directory with filters
  - `updateContributorProfile` - Update own profile
  - `getContributorDashboardStats` - Dashboard statistics
  - `getContributorApplications` - Get all applications
  - `getActiveProjects` - Get active projects with milestones

#### **Startup Controller**
- **Location:** `Backend/controllers/startup/startup.controller.ts`
- **Functions:**
  - `applyAsStartup` - Submit startup application (requires admin approval)
  - `getStartupProfile` - Get own profile with team and positions
  - `getStartupById` - Get public profile by ID
  - `getAllStartups` - Public directory with filters
  - `updateStartupProfile` - Update own profile
  - `getStartupDashboardStats` - Dashboard statistics
  - `getTeamMembers` - Get all team members

#### **Startup Application Controller (Admin)**
- **Location:** `Backend/controllers/startup/startupApplication.controller.ts`
- **Functions:**
  - `getAllStartupApplications` - List all applications (admin)
  - `getStartupApplicationById` - Get application details (admin)
  - `approveStartupApplication` - Approve and create startup profile (admin)
  - `rejectStartupApplication` - Reject with reason (admin)

#### **Job Posting Controller**
- **Location:** `Backend/controllers/startup/jobPosting.controller.ts`
- **Functions:**
  - `createJobPosting` - Create new job posting
  - `getStartupJobPostings` - Get all job postings for startup
  - `getJobPostingById` - Get job posting details
  - `updateJobPosting` - Update job posting
  - `deleteJobPosting` - Delete job posting

#### **Hiring Application Controller**
- **Location:** `Backend/controllers/hiring/hiringApplication.controller.ts`
- **Functions:**
  - `sendHiringInvitation` - Startup invites contributor
  - `applyToJobPosting` - Contributor applies to job
  - `acceptInvitation` - Contributor accepts invitation
  - `declineInvitation` - Contributor declines invitation
  - `acceptApplication` - Startup accepts application
  - `rejectApplication` - Startup rejects application
  - `getStartupApplications` - Get received applications
  - `getStartupInvitations` - Get sent invitations

---

### **3. Routes**

#### **Contributor Routes**
- **Location:** `Backend/routes/contributor/contributor.route.ts`
- **Base Path:** `/api/v1/contributor`
- **Endpoints:**
  - `GET /` - Get all contributors (public)
  - `GET /:id` - Get contributor by ID (public)
  - `POST /apply` - Apply as contributor (authenticated)
  - `GET /profile/me` - Get own profile (authenticated)
  - `PUT /profile/me` - Update own profile (authenticated)
  - `GET /dashboard/stats` - Get dashboard stats (authenticated)
  - `GET /applications` - Get applications (authenticated)
  - `GET /projects/active` - Get active projects (authenticated)

#### **Startup Routes**
- **Location:** `Backend/routes/startup/startup.route.ts`
- **Base Path:** `/api/v1/startup`
- **Endpoints:**
  - `GET /` - Get all startups (public)
  - `GET /:id` - Get startup by ID (public)
  - `POST /apply` - Apply as startup (authenticated, with logo upload)
  - `GET /profile/me` - Get own profile (authenticated)
  - `PUT /profile/me` - Update own profile (authenticated, with logo upload)
  - `GET /dashboard/stats` - Get dashboard stats (authenticated)
  - `GET /team` - Get team members (authenticated)

#### **Startup Application Routes (Admin)**
- **Location:** `Backend/routes/startup/startupApplication.route.ts`
- **Base Path:** `/api/v1/startup/applications`
- **Endpoints:**
  - `GET /` - Get all applications (admin)
  - `GET /:id` - Get application by ID (admin)
  - `POST /:id/approve` - Approve application (admin)
  - `POST /:id/reject` - Reject application (admin)

#### **Job Posting Routes**
- **Location:** `Backend/routes/startup/jobPosting.route.ts`
- **Base Path:** `/api/v1/startup/jobs`
- **Endpoints:**
  - `GET /:id` - Get job posting by ID (public)
  - `POST /` - Create job posting (authenticated)
  - `GET /` - Get all job postings for startup (authenticated)
  - `PUT /:id` - Update job posting (authenticated)
  - `DELETE /:id` - Delete job posting (authenticated)

#### **Hiring Application Routes**
- **Location:** `Backend/routes/hiring/hiringApplication.route.ts`
- **Base Path:** `/api/v1/hiring`
- **Endpoints:**
  - `POST /contributors/:contributorId/invite` - Send invitation (startup)
  - `GET /startup/applications` - Get received applications (startup)
  - `GET /startup/invitations` - Get sent invitations (startup)
  - `POST /startup/applications/:id/accept` - Accept application (startup)
  - `POST /startup/applications/:id/reject` - Reject application (startup)
  - `POST /jobs/:jobPostingId/apply` - Apply to job (contributor)
  - `POST /contributor/applications/:id/accept` - Accept invitation (contributor)
  - `POST /contributor/applications/:id/decline` - Decline invitation (contributor)

---

### **4. Updated Files**

#### **User Model**
- **File:** `Backend/models/user.mode.ts`
- **Changes:**
  - Updated `role` enum to include `'contributor'` and `'startup'`

#### **Role Auth Middleware**
- **File:** `Backend/middleware/roleAuth.ts`
- **Changes:**
  - Updated `requireAuth` to include new roles
  - Added `requireContributorOrAdmin`
  - Added `requireStartupOrAdmin`

#### **App.ts**
- **File:** `Backend/app.ts`
- **Changes:**
  - Added imports for all new routers
  - Mounted routes:
    - `/api/v1/contributor` → contributorRouter
    - `/api/v1/startup` → startupRouter
    - `/api/v1/startup/applications` → startupApplicationRouter
    - `/api/v1/startup/jobs` → jobPostingRouter
    - `/api/v1/hiring` → hiringApplicationRouter

---

## 📁 **FILE STRUCTURE**

```
Backend/
├── models/
│   ├── contributor/
│   │   └── ContributorProfile.model.ts
│   ├── startup/
│   │   ├── Startup.model.ts
│   │   ├── StartupApplication.model.ts
│   │   └── JobPosting.model.ts
│   └── hiring/
│       └── HiringApplication.model.ts
│
├── controllers/
│   ├── contributor/
│   │   └── contributor.controller.ts
│   ├── startup/
│   │   ├── startup.controller.ts
│   │   ├── startupApplication.controller.ts
│   │   └── jobPosting.controller.ts
│   └── hiring/
│       └── hiringApplication.controller.ts
│
├── routes/
│   ├── contributor/
│   │   └── contributor.route.ts
│   ├── startup/
│   │   ├── startup.route.ts
│   │   ├── startupApplication.route.ts
│   │   └── jobPosting.route.ts
│   └── hiring/
│       └── hiringApplication.route.ts
│
├── app.ts (updated)
├── models/user.mode.ts (updated)
└── middleware/roleAuth.ts (updated)
```

---

## 🔗 **API ENDPOINTS SUMMARY**

### **Contributor Endpoints:**
- `GET /api/v1/contributor` - List all contributors
- `GET /api/v1/contributor/:id` - Get contributor profile
- `POST /api/v1/contributor/apply` - Apply as contributor
- `GET /api/v1/contributor/profile/me` - Get own profile
- `PUT /api/v1/contributor/profile/me` - Update profile
- `GET /api/v1/contributor/dashboard/stats` - Dashboard stats
- `GET /api/v1/contributor/applications` - Get applications
- `GET /api/v1/contributor/projects/active` - Get active projects

### **Startup Endpoints:**
- `GET /api/v1/startup` - List all startups
- `GET /api/v1/startup/:id` - Get startup profile
- `POST /api/v1/startup/apply` - Apply as startup
- `GET /api/v1/startup/profile/me` - Get own profile
- `PUT /api/v1/startup/profile/me` - Update profile
- `GET /api/v1/startup/dashboard/stats` - Dashboard stats
- `GET /api/v1/startup/team` - Get team members

### **Startup Application Endpoints (Admin):**
- `GET /api/v1/startup/applications` - List all applications
- `GET /api/v1/startup/applications/:id` - Get application
- `POST /api/v1/startup/applications/:id/approve` - Approve
- `POST /api/v1/startup/applications/:id/reject` - Reject

### **Job Posting Endpoints:**
- `GET /api/v1/startup/jobs/:id` - Get job posting
- `POST /api/v1/startup/jobs` - Create job posting
- `GET /api/v1/startup/jobs` - List job postings
- `PUT /api/v1/startup/jobs/:id` - Update job posting
- `DELETE /api/v1/startup/jobs/:id` - Delete job posting

### **Hiring Application Endpoints:**
- `POST /api/v1/hiring/contributors/:contributorId/invite` - Send invitation
- `GET /api/v1/hiring/startup/applications` - Get applications
- `GET /api/v1/hiring/startup/invitations` - Get invitations
- `POST /api/v1/hiring/startup/applications/:id/accept` - Accept application
- `POST /api/v1/hiring/startup/applications/:id/reject` - Reject application
- `POST /api/v1/hiring/jobs/:jobPostingId/apply` - Apply to job
- `POST /api/v1/hiring/contributor/applications/:id/accept` - Accept invitation
- `POST /api/v1/hiring/contributor/applications/:id/decline` - Decline invitation

---

## 🔐 **AUTHENTICATION & AUTHORIZATION**

### **Authentication:**
- All protected routes use `isAthenticated` middleware
- JWT token validation via httpOnly cookies

### **Authorization:**
- **Public Routes:** Directory listings, public profiles
- **Authenticated Routes:** Profile management, applications
- **Role-Based:** 
  - Contributor routes require contributor role
  - Startup routes require startup role
  - Admin routes require admin role

### **Role Checks:**
- Updated `requireAuth` to include `contributor` and `startup`
- Added `requireContributorOrAdmin` helper
- Added `requireStartupOrAdmin` helper

---

## 📊 **DATABASE INDEXES**

### **ContributorProfile:**
- `userId` (unique)
- `skills`
- `availability`
- `ratings.average` (descending)
- `isVerified`

### **Startup:**
- `userId` (unique)
- `companyName` (unique)
- `industry`
- `stage`
- `fundingStatus`
- `isVerified`

### **StartupApplication:**
- `userId` (unique)
- `status`
- `createdAt` (descending)

### **JobPosting:**
- `startupId`
- `status`
- `requiredSkills`
- `postedAt` (descending)
- `applicationDeadline`

### **HiringApplication:**
- `startupId`
- `contributorId`
- `jobPostingId`
- `status`
- `createdAt` (descending)
- Compound unique index: `{startupId, contributorId, jobPostingId}` (prevents duplicates)

---

## 🔄 **WORKFLOW IMPLEMENTATION**

### **Contributor Application Flow:**
1. User submits application → `POST /contributor/apply`
2. Backend validates and creates `ContributorProfile`
3. User role updated to `contributor`
4. Profile auto-verified (isVerified: true)
5. Profile immediately visible in directory

### **Startup Application Flow:**
1. User submits application → `POST /startup/apply`
2. Backend creates `StartupApplication` (status: pending)
3. Admin reviews → `GET /startup/applications`
4. Admin approves → `POST /startup/applications/:id/approve`
5. Backend creates `Startup` profile
6. User role updated to `startup`
7. Profile visible in directory

### **Hiring Flow:**
1. **Option A - Invitation:**
   - Startup sends invitation → `POST /hiring/contributors/:id/invite`
   - Creates `HiringApplication` (status: invited)
   - Contributor accepts → `POST /hiring/contributor/applications/:id/accept`
   - Status updated to `hired`
   - Team size incremented

2. **Option B - Application:**
   - Contributor applies to job → `POST /hiring/jobs/:id/apply`
   - Creates `HiringApplication` (status: applied)
   - Applicant count incremented
   - Startup accepts → `POST /hiring/startup/applications/:id/accept`
   - Status updated to `hired`
   - Team size incremented

---

## 🛡️ **SECURITY FEATURES**

1. **Authentication Required:** All profile management requires authentication
2. **Role Validation:** Controllers check user roles before operations
3. **Ownership Checks:** Users can only modify their own profiles
4. **Admin Protection:** Admin routes protected with `requireAdmin`
5. **Input Validation:** All inputs validated (length, type, required fields)
6. **Unique Constraints:** Company names, user profiles are unique
7. **Status Checks:** Prevents duplicate applications/invitations

---

## 📝 **NOTES**

1. **Auto-Approval:** Contributor profiles are auto-approved (isVerified: true)
2. **Admin Approval:** Startup applications require admin approval
3. **File Uploads:** Logo uploads use Cloudinary (same as marketplace)
4. **Error Handling:** All controllers use `CatchAsyncError` wrapper
5. **Logging:** All operations logged using Winston logger
6. **Pagination:** Directory endpoints support pagination
7. **Filtering:** Directory endpoints support search and filters
8. **Populate:** Related data populated (userId, startupId, contributorId)

---

## ✅ **COMPLETION STATUS**

- ✅ Contributor Profile model
- ✅ Startup model
- ✅ Startup Application model
- ✅ Job Posting model
- ✅ Hiring Application model
- ✅ Contributor controller (all functions)
- ✅ Startup controller (all functions)
- ✅ Startup Application controller (admin)
- ✅ Job Posting controller
- ✅ Hiring Application controller
- ✅ All routes created
- ✅ Routes mounted in app.ts
- ✅ User model updated
- ✅ Role auth middleware updated
- ✅ Indexes created
- ✅ Validation implemented
- ✅ Error handling
- ✅ Logging

---

**Backend implementation is complete and follows the same structure as marketplace!**
