# Complete Hiring Flow Analysis - Deep Dive
## Milestone-Based Funding System: Contributor-Startup-Admin Interactions

---

## 📋 **TABLE OF CONTENTS**

1. [System Overview](#system-overview)
2. [Role Definitions & Prerequisites](#role-definitions--prerequisites)
3. [Complete Application Flow](#complete-application-flow)
4. [Hiring Interaction Flows](#hiring-interaction-flows)
5. [Admin Approval Workflows](#admin-approval-workflows)
6. [Status Transitions & State Management](#status-transitions--state-management)
7. [Communication Flows](#communication-flows)
8. [Edge Cases & Error Handling](#edge-cases--error-handling)
9. [Data Models & Relationships](#data-models--relationships)
10. [API Endpoints & Permissions](#api-endpoints--permissions)

---

## 🎯 **SYSTEM OVERVIEW**

### **Core Entities:**
1. **User** (Base entity with role: 'user' | 'startup' | 'contributor' | 'admin')
2. **Startup** (Company profile linked to user with role='startup')
3. **Contributor Profile** (Professional profile linked to user with role='contributor')
4. **Hiring Application** (Connection between startup and contributor)
5. **Milestone** (Work assignment with funding tied to completion)
6. **Funding Application** (Startup's request for milestone-based funding)

### **Key Relationships:**
```
User (role: startup) → Startup Profile → Funding Application → Milestones
User (role: contributor) → Contributor Profile → Hiring Applications
Admin → Reviews & Approves → Applications, Funding, Milestones
```

---

## 👤 **ROLE DEFINITIONS & PREREQUISITES**

### **1. CONTRIBUTOR ROLE**

#### **Prerequisites to Become Contributor:**
- User must have `role: 'user'` initially
- User must create Contributor Profile with:
  - Skills (minimum 1 skill required)
  - Portfolio (at least 1 project)
  - Availability status
  - Bio/description
  - Hourly rate or project rate (optional initially)

#### **Application Process:**
1. User navigates to "Become a Contributor" page
2. Fills out Contributor Profile form:
   - **Personal Info:**
     - Bio (min 50 chars, max 500 chars)
     - Skills array (select from predefined list: Frontend, Backend, DevOps, Design, Marketing, etc.)
     - Hourly rate (optional, can set later)
     - Availability: 'available' | 'busy' | 'unavailable'
   
   - **Portfolio:**
     - Project title
     - Description
     - Images/screenshots (max 5 per project)
     - Live link (optional)
     - Technologies used
   
   - **Certifications:**
     - Certificate name
     - Issuing organization
     - Certificate URL/image
     - Issue date

3. User submits application
4. **System automatically approves** (or can be set to require admin approval)
5. User role changes from 'user' → 'contributor'
6. Contributor Profile becomes visible in public directory

#### **Contributor Profile Visibility:**
- **Public (visible to all):**
  - Name, avatar
  - Skills
  - Portfolio (public projects only)
  - Ratings & reviews
  - Availability status
  - Completed projects count
  - Hourly rate (if set)

- **Private (visible to startups after hiring):**
  - Full portfolio
  - Certifications
  - Contact information
  - Payment details
  - Work history with other startups

---

### **2. STARTUP ROLE**

#### **Prerequisites to Become Startup:**
- User must have `role: 'user'` initially
- User must submit Startup Application with:
  - Company name
  - Company description
  - Industry/sector
  - Stage (ideation | execute | scale)
  - Founder information
  - Business plan summary (optional)

#### **Application Process:**
1. User navigates to "Apply as Startup" page
2. Fills out Startup Application form:
   - **Company Information:**
     - Company name (unique, max 100 chars)
     - Company logo (upload)
     - Company description (min 100 chars, max 2000 chars)
     - Industry (select from dropdown)
     - Stage: 'ideation' | 'execute' | 'scale'
     - Website URL (optional)
     - Social media links (optional)
   
   - **Founder Information:**
     - Founder name (from user profile)
     - Founder email (from user profile)
     - Founder bio (min 50 chars)
     - Previous experience
   
   - **Business Plan:**
     - Problem statement
     - Solution description
     - Target market
     - Competitive advantage
     - Initial funding needs (optional, can apply later)

3. User submits application
4. **Status: 'pending'** → Application sent to Admin queue
5. **Admin reviews application:**
   - Admin sees application in "Startup Applications" dashboard
   - Admin can view full application details
   - Admin can approve or reject
   - If rejected: Admin provides rejection reason
   - If approved: User role changes from 'user' → 'startup'
6. Startup Profile is created and becomes visible

#### **Startup Profile Visibility:**
- **Public (visible to all):**
  - Company name, logo
  - Industry, stage
  - Description
  - Team size
  - Funding status
  - Open positions (if any)
  - Milestones achieved count

- **Private (visible to admin/contributors after hiring):**
  - Full business plan
  - Funding details
  - Team members list
  - Financial information

---

### **3. ADMIN ROLE**

#### **Admin Capabilities:**
- View all startup applications (pending, approved, rejected)
- View all contributor profiles
- Approve/reject startup applications
- Approve/reject funding applications
- Verify milestones
- Manage disputes
- View all hiring applications
- Override any decision
- Assign roles

---

## 🔄 **COMPLETE APPLICATION FLOW**

### **FLOW 1: User → Contributor Application**

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: User Initiates Application                          │
├─────────────────────────────────────────────────────────────┤
│ • User (role: 'user') clicks "Become a Contributor"         │
│ • System checks: Is user already contributor? → No          │
│ • System shows Contributor Profile Creation Form            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: User Fills Profile Form                            │
├─────────────────────────────────────────────────────────────┤
│ Required Fields:                                             │
│ • Bio (50-500 chars)                                         │
│ • Skills (min 1, max 10)                                     │
│ • Portfolio (min 1 project)                                │
│                                                              │
│ Optional Fields:                                             │
│ • Hourly rate                                                │
│ • Certifications                                             │
│ • Availability (default: 'available')                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Form Validation                                     │
├─────────────────────────────────────────────────────────────┤
│ Client-side validation:                                      │
│ ✓ Bio length check                                           │
│ ✓ Skills count check                                         │
│ ✓ Portfolio project count check                              │
│ ✓ Image upload validation                                    │
│                                                              │
│ Server-side validation:                                      │
│ ✓ User exists                                                │
│ ✓ User role is 'user'                                        │
│ ✓ No existing contributor profile                            │
│ ✓ Skills are from allowed list                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Create Contributor Profile                          │
├─────────────────────────────────────────────────────────────┤
│ Backend creates:                                             │
│ • ContributorProfile document                                │
│   - userId: ObjectId                                         │
│   - skills: ['Frontend', 'Backend']                         │
│   - portfolio: [...]                                         │
│   - availability: 'available'                                │
│   - isVerified: false (initially)                           │
│   - ratings: { average: 0, count: 0 }                       │
│                                                              │
│ • Update User document:                                       │
│   - role: 'user' → 'contributor'                             │
│   - contributorProfileId: ObjectId                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Auto-Approval (or Admin Review)                     │
├─────────────────────────────────────────────────────────────┤
│ Option A: Auto-Approval (Recommended for MVP):              │
│ • ContributorProfile.isVerified = true                        │
│ • Profile immediately visible in directory                   │
│ • User can start receiving invitations                       │
│                                                              │
│ Option B: Admin Review:                                      │
│ • ContributorProfile.isVerified = false                      │
│ • Admin receives notification                                │
│ • Admin reviews in "Contributor Applications" dashboard      │
│ • Admin approves → isVerified = true                         │
│ • Admin rejects → Application deleted, role reverted        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Success & Notification                              │
├─────────────────────────────────────────────────────────────┤
│ • User receives success notification                         │
│ • Redirect to Contributor Dashboard                          │
│ • Profile visible in public Contributor Directory            │
│ • Can now browse startup opportunities                       │
└─────────────────────────────────────────────────────────────┘
```

---

### **FLOW 2: User → Startup Application**

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: User Initiates Startup Application                  │
├─────────────────────────────────────────────────────────────┤
│ • User (role: 'user') clicks "Apply as Startup"             │
│ • System checks: Is user already startup? → No              │
│ • System shows Startup Application Form                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: User Fills Application Form                         │
├─────────────────────────────────────────────────────────────┤
│ Required Fields:                                             │
│ • Company name (unique)                                       │
│ • Company description (100-2000 chars)                     │
│ • Industry (dropdown selection)                              │
│ • Stage: ideation | execute | scale                          │
│ • Founder bio (50-500 chars)                                │
│                                                              │
│ Optional Fields:                                             │
│ • Company logo                                                │
│ • Website URL                                                 │
│ • Business plan details                                       │
│ • Initial funding request                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Form Validation                                      │
├─────────────────────────────────────────────────────────────┤
│ Client-side validation:                                       │
│ ✓ Company name uniqueness check                              │
│ ✓ Description length check                                   │
│ ✓ Required fields check                                      │
│ ✓ Logo file size/format check                                │
│                                                              │
│ Server-side validation:                                      │
│ ✓ User exists                                                 │
│ ✓ User role is 'user'                                        │
│ ✓ Company name is unique                                     │
│ ✓ No existing startup profile                                │
│ ✓ Industry is from allowed list                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Create Startup Application                          │
├─────────────────────────────────────────────────────────────┤
│ Backend creates:                                              │
│ • StartupApplication document:                                │
│   - userId: ObjectId                                          │
│   - companyName: string                                       │
│   - description: string                                      │
│   - industry: string                                          │
│   - stage: string                                            │
│   - status: 'pending'                                        │
│   - submittedAt: Date                                        │
│                                                              │
│ • User role remains 'user' (not changed yet)                │
│ • Application added to Admin review queue                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Admin Review (REQUIRED)                             │
├─────────────────────────────────────────────────────────────┤
│ Admin Dashboard shows:                                        │
│ • New application in "Pending Startup Applications"          │
│ • Application details:                                        │
│   - Company name, description                                │
│   - Industry, stage                                          │
│   - Founder information                                       │
│   - Business plan (if provided)                              │
│   - Submitted date                                            │
│                                                              │
│ Admin Actions:                                                │
│ • View full application                                       │
│ • Approve → Creates Startup Profile                          │
│ • Reject → Provides rejection reason                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6A: Admin Approves                                      │
├─────────────────────────────────────────────────────────────┤
│ Backend creates:                                              │
│ • Startup Profile document:                                   │
│   - userId: ObjectId                                          │
│   - companyName: string                                      │
│   - logo: string (uploaded URL)                              │
│   - description: string                                       │
│   - industry: string                                         │
│   - stage: string                                            │
│   - fundingStatus: 'applying' (no funding yet)               │
│   - totalFunding: 0                                          │
│   - currentBalance: 0                                         │
│   - teamMembers: []                                          │
│   - milestones: []                                           │
│                                                              │
│ • Update User:                                                │
│   - role: 'user' → 'startup'                                 │
│   - startupId: ObjectId                                      │
│                                                              │
│ • Update StartupApplication:                                  │
│   - status: 'pending' → 'approved'                           │
│   - reviewedBy: admin._id                                    │
│   - reviewedAt: Date                                         │
│                                                              │
│ • Notification sent to user                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6B: Admin Rejects                                        │
├─────────────────────────────────────────────────────────────┤
│ Backend updates:                                              │
│ • StartupApplication:                                        │
│   - status: 'pending' → 'rejected'                           │
│   - rejectionReason: string (from admin)                     │
│   - reviewedBy: admin._id                                   │
│   - reviewedAt: Date                                         │
│                                                              │
│ • User role remains 'user'                                    │
│ • No Startup Profile created                                  │
│ • Notification sent to user with rejection reason            │
│ • User can reapply after addressing issues                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 7: User Notification & Next Steps                      │
├─────────────────────────────────────────────────────────────┤
│ If Approved:                                                  │
│ • Email notification: "Your startup application approved"     │
│ • In-app notification                                         │
│ • Redirect to Startup Dashboard                              │
│ • Can now create funding application                          │
│ • Can browse contributor directory                            │
│                                                              │
│ If Rejected:                                                   │
│ • Email notification with rejection reason                    │
│ • In-app notification                                         │
│ • Can view rejection reason in dashboard                      │
│ • Can submit new application (after 30 days or immediately) │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤝 **HIRING INTERACTION FLOWS**

### **FLOW 3: Startup Hires Contributor - Direct Invitation**

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Startup Browses Contributor Directory               │
├─────────────────────────────────────────────────────────────┤
│ Startup (role: 'startup') navigates to:                      │
│ • "/contributors" or "/talent" page                          │
│                                                              │
│ Directory displays:                                          │
│ • Grid/List of contributor cards                             │
│ • Each card shows:                                           │
│   - Avatar, name                                             │
│   - Skills (tags)                                            │
│   - Availability badge                                        │
│   - Rating (if any)                                          │
│   - Hourly rate (if set)                                     │
│   - Completed projects count                                 │
│                                                              │
│ Filters available:                                            │
│ • Skills (multi-select)                                       │
│ • Availability                                               │
│ • Rating (min rating)                                        │
│ • Price range                                                │
│ • Search by name                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Startup Views Contributor Profile                    │
├─────────────────────────────────────────────────────────────┤
│ Startup clicks on contributor card                            │
│                                                              │
│ Profile page shows:                                           │
│ • Full profile information                                    │
│ • Portfolio projects (public ones)                            │
│ • Skills & expertise                                         │
│ • Ratings & reviews                                          │
│ • Availability status                                        │
│ • Past work (if any)                                         │
│                                                              │
│ Actions available:                                            │
│ • "Send Hiring Invitation" button                            │
│ • "Message" button (opens messaging)                         │
│ • "View Portfolio" (if more projects)                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Startup Sends Hiring Invitation                      │
├─────────────────────────────────────────────────────────────┤
│ Startup clicks "Send Hiring Invitation"                       │
│                                                              │
│ Modal/Form appears with:                                      │
│ • Role/Position title (e.g., "Frontend Developer")           │
│ • Project description                                         │
│ • Expected duration (optional)                                │
│ • Compensation type:                                          │
│   - Milestone-based (recommended)                             │
│   - Fixed project fee                                         │
│   - Hourly rate                                               │
│ • Compensation amount                                         │
│ • Start date (optional)                                      │
│ • Additional notes                                            │
│                                                              │
│ System validation:                                            │
│ ✓ Startup has active funding (if milestone-based)            │
│ ✓ Contributor is available                                  │
│ ✓ No existing active hiring for this contributor            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Create Hiring Application                           │
├─────────────────────────────────────────────────────────────┤
│ Backend creates:                                              │
│ • HiringApplication document:                                 │
│   - startupId: ObjectId                                       │
│   - contributorId: ObjectId                                 │
│   - role: string ("Frontend Developer")                      │
│   - projectDescription: string                               │
│   - compensationType: 'milestone-based' | 'fixed' | 'hourly'  │
│   - compensationAmount: number                               │
│   - status: 'invited'                                         │
│   - invitedAt: Date                                          │
│   - invitedBy: startup.userId                                │
│                                                              │
│ • Create initial message in messaging system:                 │
│   - senderId: startup.userId                                │
│   - receiverId: contributor.userId                          │
│   - subject: "Hiring Invitation: [Role]"                     │
│   - message: "We'd like to invite you to join our team..."   │
│   - context: 'hiring-invitation'                             │
│   - relatedApplicationId: HiringApplication._id             │
│                                                              │
│ • Notification sent to contributor                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Contributor Receives Notification                  │
├─────────────────────────────────────────────────────────────┤
│ Contributor receives:                                         │
│ • In-app notification: "New hiring invitation from [Startup]"│
│ • Email notification (if enabled)                              │
│ • Notification appears in:                                   │
│   - Dashboard notifications                                   │
│   - Hiring Applications section                              │
│   - Messages (new conversation created)                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Contributor Reviews Invitation                       │
├─────────────────────────────────────────────────────────────┤
│ Contributor navigates to:                                     │
│ • "/contributor/hiring-applications" or                      │
│ • Notification → Opens invitation details                     │
│                                                              │
│ Invitation details show:                                      │
│ • Startup name, logo, industry                                │
│ • Role/position                                               │
│ • Project description                                         │
│ • Compensation details                                        │
│ • Expected duration                                           │
│ • Startup's funding status                                    │
│ • Startup's team size                                        │
│                                                              │
│ Actions available:                                            │
│ • "Accept Invitation"                                         │
│ • "Decline Invitation"                                        │
│ • "Message Startup" (to ask questions)                       │
│ • "View Startup Profile"                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 7A: Contributor Accepts                                 │
├─────────────────────────────────────────────────────────────┤
│ Contributor clicks "Accept Invitation"                        │
│                                                              │
│ Backend updates:                                              │
│ • HiringApplication:                                          │
│   - status: 'invited' → 'hired'                              │
│   - acceptedAt: Date                                         │
│   - startDate: Date (if provided, else current date)         │
│                                                              │
│ • Add contributor to Startup team:                            │
│   Startup.teamMembers.push({                                  │
│     contributorId: contributor._id,                          │
│     role: HiringApplication.role,                            │
│     joinedDate: Date,                                        │
│     status: 'active'                                         │
│   })                                                          │
│                                                              │
│ • Update Contributor Profile:                                  │
│   - Add startup to activeProjects                             │
│   - Update availability if needed                             │
│                                                              │
│ • Create system message:                                       │
│   "You have been hired by [Startup] as [Role]"               │
│                                                              │
│ • Notifications:                                               │
│   - Contributor: "You've been hired!"                          │
│   - Startup: "[Contributor] accepted your invitation"       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 7B: Contributor Declines                                │
├─────────────────────────────────────────────────────────────┤
│ Contributor clicks "Decline Invitation"                       │
│ Optional: Provide decline reason                             │
│                                                              │
│ Backend updates:                                              │
│ • HiringApplication:                                          │
│   - status: 'invited' → 'declined'                           │
│   - declinedAt: Date                                         │
│   - declineReason: string (optional)                          │
│                                                              │
│ • Notification sent to startup:                                │
│   "[Contributor] declined your hiring invitation"             │
│                                                              │
│ • HiringApplication remains in history                        │
│ • Startup can send new invitation (after 7 days)             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 8: Post-Hiring Setup (If Accepted)                    │
├─────────────────────────────────────────────────────────────┤
│ After acceptance:                                              │
│                                                              │
│ For Contributor:                                              │
│ • Can see startup's milestones (assigned ones)                │
│ • Can access startup's project workspace                      │
│ • Can communicate with startup team                           │
│ • Dashboard shows new active project                          │
│                                                              │
│ For Startup:                                                  │
│ • Contributor appears in team members list                    │
│ • Can assign milestones to contributor                        │
│ • Can communicate with contributor                            │
│ • Team dashboard updated                                      │
│                                                              │
│ Both can now:                                                 │
│ • Use messaging system for project communication               │
│ • Share files/deliverables                                    │
│ • Track milestone progress                                    │
└─────────────────────────────────────────────────────────────┘
```

---

### **FLOW 4: Contributor Applies to Startup Position**

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Startup Creates Job Posting                         │
├─────────────────────────────────────────────────────────────┤
│ Startup navigates to "Post Job" or "Hire Contributors"       │
│                                                              │
│ Creates job posting with:                                    │
│ • Job title/role                                              │
│ • Required skills                                             │
│ • Job description                                             │
│ • Project scope                                               │
│ • Compensation details                                        │
│ • Expected duration                                           │
│ • Application deadline (optional)                             │
│                                                              │
│ Backend creates:                                              │
│ • JobPosting document:                                        │
│   - startupId: ObjectId                                       │
│   - title: string                                            │
│   - description: string                                       │
│   - requiredSkills: [string]                                 │
│   - compensationType: string                                 │
│   - compensationAmount: number                               │
│   - status: 'open'                                           │
│   - postedAt: Date                                          │
│   - deadline: Date (optional)                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Job Posting Appears in Directory                     │
├─────────────────────────────────────────────────────────────┤
│ Job posting visible in:                                       │
│ • "/opportunities" page (for contributors)                    │
│ • Startup's profile page                                      │
│ • Contributor dashboard "Available Opportunities"             │
│                                                              │
│ Display shows:                                                │
│ • Startup name, logo                                          │
│ • Job title                                                   │
│ • Required skills                                             │
│ • Compensation range                                         │
│ • Posted date                                                │
│ • Application deadline (if set)                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Contributor Views Job Posting                        │
├─────────────────────────────────────────────────────────────┤
│ Contributor clicks on job posting                             │
│                                                              │
│ Full details show:                                            │
│ • Complete job description                                    │
│ • Required skills (matched with contributor's skills)        │
│ • Compensation details                                        │
│ • Project timeline                                            │
│ • Startup information                                        │
│ • Number of applicants (if public)                           │
│                                                              │
│ Actions:                                                      │
│ • "Apply Now" button                                          │
│ • "Save for Later"                                            │
│ • "Message Startup" (to ask questions)                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Contributor Applies                                  │
├─────────────────────────────────────────────────────────────┤
│ Contributor clicks "Apply Now"                                │
│                                                              │
│ Application form (pre-filled from profile):                   │
│ • Cover letter (optional, max 1000 chars)                     │
│ • Relevant portfolio projects (select from portfolio)        │
│ • Why interested in this role (optional)                      │
│ • Availability confirmation                                   │
│ • Expected start date                                         │
│                                                              │
│ System checks:                                                 │
│ ✓ Contributor has required skills (or warns if missing)       │
│ ✓ Contributor is available                                   │
│ ✓ Not already applied to this posting                        │
│ ✓ Job posting is still open                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Create Application                                  │
├─────────────────────────────────────────────────────────────┤
│ Backend creates:                                              │
│ • HiringApplication document:                                 │
│   - startupId: ObjectId                                       │
│   - contributorId: ObjectId                                 │
│   - jobPostingId: ObjectId (if from posting)                 │
│   - role: string (from job posting)                           │
│   - coverLetter: string (optional)                           │
│   - selectedPortfolio: [ObjectId]                            │
│   - status: 'applied'                                         │
│   - appliedAt: Date                                          │
│                                                              │
│ • Create message in messaging system:                         │
│   - senderId: contributor.userId                             │
│   - receiverId: startup.userId                               │
│   - subject: "Application for [Job Title]"                   │
│   - message: coverLetter or default message                  │
│   - context: 'job-application'                                │
│   - relatedApplicationId: HiringApplication._id             │
│                                                              │
│ • Notification sent to startup                                │
│ • Update job posting applicant count                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Startup Receives Application                        │
├─────────────────────────────────────────────────────────────┤
│ Startup receives:                                             │
│ • In-app notification: "New application from [Contributor]"   │
│ • Email notification (if enabled)                              │
│ • Application appears in:                                     │
│   - Dashboard "Applications" section                          │
│   - "/startup/applications" page                              │
│   - Messages (new conversation)                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 7: Startup Reviews Application                         │
├─────────────────────────────────────────────────────────────┤
│ Startup views application details:                            │
│ • Contributor profile (full access)                            │
│ • Cover letter                                                │
│ • Selected portfolio projects                                 │
│ • Skills match score                                          │
│ • Past work history                                          │
│ • Ratings & reviews                                          │
│                                                              │
│ Actions available:                                            │
│ • "Accept Application" → Hires contributor                    │
│ • "Reject Application" → Provides rejection reason           │
│ • "Message Contributor" → Opens conversation                   │
│ • "Request More Info" → Sends message with questions          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 8A: Startup Accepts Application                        │
├─────────────────────────────────────────────────────────────┤
│ Same as FLOW 3, STEP 7A (Accept Invitation)                  │
│                                                              │
│ Backend updates:                                              │
│ • HiringApplication:                                          │
│   - status: 'applied' → 'hired'                              │
│   - acceptedAt: Date                                         │
│                                                              │
│ • Add to startup team                                         │
│ • Update contributor profile                                  │
│ • Notifications sent                                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 8B: Startup Rejects Application                         │
├─────────────────────────────────────────────────────────────┤
│ Startup provides rejection reason (optional)                  │
│                                                              │
│ Backend updates:                                              │
│ • HiringApplication:                                          │
│   - status: 'applied' → 'rejected'                            │
│   - rejectedAt: Date                                         │
│   - rejectionReason: string                                   │
│                                                              │
│ • Notification sent to contributor                            │
│ • Application remains in history                              │
│ • Contributor can apply to other positions                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 👨‍💼 **ADMIN APPROVAL WORKFLOWS**

### **FLOW 5: Admin Reviews Startup Application**

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Application Appears in Admin Dashboard              │
├─────────────────────────────────────────────────────────────┤
│ Admin navigates to:                                           │
│ • "/admin/startup-applications"                               │
│                                                              │
│ Dashboard shows:                                              │
│ • List of all startup applications                            │
│ • Filter by status: pending | approved | rejected            │
│ • Sort by: date | company name                               │
│ • Search by company name                                      │
│                                                              │
│ Pending applications highlighted                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Admin Views Application Details                     │
├─────────────────────────────────────────────────────────────┤
│ Admin clicks on application                                   │
│                                                              │
│ Full application view shows:                                  │
│ • Company Information:                                        │
│   - Company name                                              │
│   - Logo                                                      │
│   - Description                                              │
│   - Industry                                                  │
│   - Stage                                                     │
│   - Website/social links                                      │
│                                                              │
│ • Founder Information:                                        │
│   - Name, email                                               │
│   - Bio                                                       │
│   - Previous experience                                       │
│   - User profile link                                         │
│                                                              │
│ • Business Plan (if provided):                               │
│   - Problem statement                                         │
│   - Solution                                                  │
│   - Target market                                             │
│   - Competitive advantage                                     │
│                                                              │
│ • Application Metadata:                                       │
│   - Submitted date                                            │
│   - Application ID                                            │
│   - User ID (for reference)                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Admin Reviews & Makes Decision                      │
├─────────────────────────────────────────────────────────────┤
│ Admin evaluates:                                              │
│ • Company information completeness                            │
│ • Business viability                                          │
│ • Founder credibility                                         │
│ • Alignment with platform goals                               │
│                                                              │
│ Admin actions:                                                │
│ • "Approve" button                                            │
│ • "Reject" button (requires reason)                          │
│ • "Request More Info" (sends message to user)                │
│ • "Flag for Review" (marks for later)                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4A: Admin Approves                                      │
├─────────────────────────────────────────────────────────────┤
│ Admin clicks "Approve"                                        │
│ Optional: Add approval notes                                 │
│                                                              │
│ Backend processes:                                            │
│ 1. Create Startup Profile:                                    │
│    • Copy data from application                                │
│    • Set initial statuses                                     │
│    • Initialize empty arrays (team, milestones)              │
│                                                              │
│ 2. Update User:                                                │
│    • role: 'user' → 'startup'                                 │
│    • startupId: new Startup._id                               │
│                                                              │
│ 3. Update StartupApplication:                                 │
│    • status: 'pending' → 'approved'                           │
│    • reviewedBy: admin._id                                    │
│    • reviewedAt: Date                                        │
│    • approvalNotes: string (optional)                         │
│                                                              │
│ 4. Send notifications:                                         │
│    • Email to user: "Your startup application approved"      │
│    • In-app notification                                       │
│    • System message in user's inbox                           │
│                                                              │
│ 5. Log admin action:                                          │
│    • Admin action log entry                                   │
│    • Audit trail                                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4B: Admin Rejects                                        │
├─────────────────────────────────────────────────────────────┤
│ Admin clicks "Reject"                                         │
│ Required: Provide rejection reason (min 20 chars)            │
│                                                              │
│ Rejection reason options (dropdown + custom):                │
│ • "Incomplete information"                                    │
│ • "Does not meet platform criteria"                           │
│ • "Business model concerns"                                   │
│ • "Other" (requires custom text)                              │
│                                                              │
│ Backend processes:                                            │
│ 1. Update StartupApplication:                                 │
│    • status: 'pending' → 'rejected'                          │
│    • reviewedBy: admin._id                                    │
│    • reviewedAt: Date                                        │
│    • rejectionReason: string (required)                       │
│                                                              │
│ 2. User role remains 'user'                                    │
│ 3. No Startup Profile created                                 │
│                                                              │
│ 4. Send notifications:                                         │
│    • Email: "Startup application update" with reason          │
│    • In-app notification with rejection reason                │
│    • System message with detailed feedback                    │
│                                                              │
│ 5. Log admin action                                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Post-Approval Actions                                 │
├─────────────────────────────────────────────────────────────┤
│ If Approved:                                                  │
│ • User can now access Startup Dashboard                       │
│ • Can create funding application                               │
│ • Can browse contributor directory                             │
│ • Startup profile visible in public directory                 │
│                                                              │
│ If Rejected:                                                   │
│ • User can view rejection reason in dashboard                  │
│ • Can submit new application (after cooldown period)         │
│ • Can contact admin for clarification                         │
│ • Application archived but accessible                         │
└─────────────────────────────────────────────────────────────┘
```

---

### **FLOW 6: Admin Reviews Funding Application**

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Startup Creates Funding Application                  │
├─────────────────────────────────────────────────────────────┤
│ Startup (already approved) navigates to:                     │
│ • "/startup/funding/apply"                                    │
│                                                              │
│ Funding application form:                                    │
│ • Requested total amount                                     │
│ • Use case description                                       │
│ • Milestones breakdown:                                       │
│   - Milestone 1: Title, description, amount, timeline        │
│   - Milestone 2: ...                                         │
│   - Add more milestones                                      │
│ • Business justification                                      │
│ • Expected outcomes                                          │
│                                                              │
│ Backend creates:                                              │
│ • FundingApplication document:                                │
│   - startupId: ObjectId                                      │
│   - requestedAmount: number                                  │
│   - useCase: string                                          │
│   - milestones: [{ title, description, amount, timeline }]  │
│   - status: 'pending'                                        │
│   - submittedAt: Date                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Application Appears in Admin Dashboard               │
├─────────────────────────────────────────────────────────────┤
│ Admin navigates to:                                           │
│ • "/admin/funding-applications"                              │
│                                                              │
│ Dashboard shows:                                              │
│ • List of funding applications                                │
│ • Filter by: status | startup | amount range                 │
│ • Sort by: date | amount                                     │
│                                                              │
│ Each application shows:                                       │
│ • Startup name, logo                                          │
│ • Requested amount                                           │
│ • Number of milestones                                        │
│ • Submitted date                                             │
│ • Status badge                                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Admin Reviews Funding Application                     │
├─────────────────────────────────────────────────────────────┤
│ Admin clicks on application                                   │
│                                                              │
│ Full application view:                                        │
│ • Startup Information:                                        │
│   - Company name, industry, stage                             │
│   - Current funding status                                    │
│   - Team size                                                │
│                                                              │
│ • Funding Request:                                            │
│   - Total requested amount                                   │
│   - Use case description                                      │
│   - Business justification                                    │
│                                                              │
│ • Milestones Breakdown:                                       │
│   - Each milestone:                                          │
│     * Title                                                   │
│     * Description                                             │
│     * Funding amount                                          │
│     * Timeline                                                │
│     * Success criteria (if provided)                         │
│                                                              │
│ • Startup History (if any):                                   │
│   - Previous funding                                          │
│   - Completed milestones                                      │
│   - Team performance                                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Admin Makes Decision                                 │
├─────────────────────────────────────────────────────────────┤
│ Admin evaluates:                                              │
│ • Funding amount reasonableness                               │
│ • Milestone clarity & achievability                           │
│ • Startup's track record (if any)                             │
│ • Business case strength                                      │
│ • Available funding pool                                      │
│                                                              │
│ Admin actions:                                                │
│ • "Approve" (full amount or modified)                        │
│ • "Approve with Modifications" (adjust amounts/milestones)   │
│ • "Reject" (with reason)                                     │
│ • "Request Changes" (send back for revision)                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5A: Admin Approves (Full or Modified)                   │
├─────────────────────────────────────────────────────────────┤
│ Admin clicks "Approve"                                        │
│ Optional: Modify funding amounts or milestones                │
│                                                              │
│ Backend processes:                                            │
│ 1. Create Milestone documents:                               │
│    For each approved milestone:                              │
│    • Milestone document:                                      │
│      - startupId: ObjectId                                     │
│      - title: string                                          │
│      - description: string                                    │
│      - fundingAmount: number (approved amount)               │
│      - dueDate: Date (from timeline)                         │
│      - status: 'pending'                                      │
│      - assignedContributors: []                              │
│                                                              │
│ 2. Update Startup:                                             │
│    • fundingStatus: 'applying' → 'approved'                  │
│    • totalFunding: += approved total                          │
│    • currentBalance: 0 (funds released per milestone)        │
│    • milestones: [push new milestone IDs]                     │
│                                                              │
│ 3. Update FundingApplication:                                 │
│    • status: 'pending' → 'approved'                           │
│    • approvedAmount: number (may differ from requested)      │
│    • reviewedBy: admin._id                                    │
│    • reviewedAt: Date                                        │
│    • approvalNotes: string                                    │
│                                                              │
│ 4. Allocate funding (if platform manages pool):              │
│    • Reserve funds for milestones                             │
│    • Update funding pool balance                              │
│                                                              │
│ 5. Send notifications:                                        │
│    • Email: "Funding application approved"                    │
│    • In-app notification                                      │
│    • Details of approved milestones                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5B: Admin Rejects                                        │
├─────────────────────────────────────────────────────────────┤
│ Admin provides rejection reason                               │
│                                                              │
│ Backend processes:                                            │
│ 1. Update FundingApplication:                                │
│    • status: 'pending' → 'rejected'                          │
│    • rejectionReason: string                                  │
│    • reviewedBy: admin._id                                    │
│    • reviewedAt: Date                                        │
│                                                              │
│ 2. Startup fundingStatus remains 'applying'                   │
│ 3. No milestones created                                       │
│                                                              │
│ 4. Send notifications:                                        │
│    • Email with rejection reason                              │
│    • In-app notification                                      │
│                                                              │
│ 5. Startup can revise and resubmit                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Post-Approval (If Approved)                          │
├─────────────────────────────────────────────────────────────┤
│ Startup can now:                                              │
│ • View approved milestones in dashboard                       │
│ • Start hiring contributors                                   │
│ • Assign milestones to contributors                            │
│ • Begin working on milestones                                  │
│                                                              │
│ Funding release:                                              │
│ • Funds NOT released immediately                              │
│ • Funds released when milestone is verified                    │
│ • Each milestone verified separately                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 **STATUS TRANSITIONS & STATE MANAGEMENT**

### **HiringApplication Status Flow:**

```
┌─────────────┐
│   invited   │  (Startup sends invitation)
└──────┬──────┘
       │
       ├───→ accepted ───→ hired ───→ active ───→ completed
       │         │            │          │            │
       │         │            │          │            └──→ terminated
       │         │            │          │
       │         │            │          └──→ paused
       │         │            │
       │         │            └──→ terminated
       │         │
       └───→ declined
       
┌─────────────┐
│   applied   │  (Contributor applies to job)
└──────┬──────┘
       │
       ├───→ accepted ───→ hired ───→ active ───→ completed
       │         │            │          │            │
       │         │            │          │            └──→ terminated
       │         │            │          │
       │         │            │          └──→ paused
       │         │            │
       │         │            └──→ terminated
       │         │
       └───→ rejected
```

### **Status Definitions:**

- **invited**: Startup sent hiring invitation, waiting for contributor response
- **applied**: Contributor applied to startup position, waiting for startup response
- **hired**: Contributor accepted/startup accepted, contributor added to team
- **active**: Contributor actively working on assigned milestones
- **paused**: Temporarily paused (by startup or contributor)
- **completed**: All assigned work completed, relationship ended successfully
- **terminated**: Relationship ended early (by either party or admin)
- **declined**: Contributor declined invitation
- **rejected**: Startup rejected application

### **StartupApplication Status Flow:**

```
pending → approved → (Startup Profile Created)
    │
    └──→ rejected
```

### **FundingApplication Status Flow:**

```
pending → approved → (Milestones Created)
    │
    └──→ rejected
    │
    └──→ changes-requested → (Startup revises) → pending
```

### **Milestone Status Flow:**

```
pending → in-progress → submitted → verified → completed
    │          │            │           │
    │          │            │           └──→ rejected → (can resubmit)
    │          │            │
    │          │            └──→ (startup reviews) → approved → verified
    │          │                                    └──→ rejected
    │          │
    └──→ (auto-pause if overdue)
```

---

## 💬 **COMMUNICATION FLOWS**

### **Communication Channels:**

1. **Messaging System** (Existing marketplace messaging)
   - Used for: Hiring invitations, applications, project discussions
   - Context types: 'hiring-invitation', 'job-application', 'milestone-discussion'
   - File attachments supported

2. **Notifications**
   - In-app notifications
   - Email notifications (optional)
   - Real-time updates

3. **System Messages**
   - Automated messages for status changes
   - Admin announcements
   - Milestone updates

### **Message Contexts:**

- **hiring-invitation**: Startup → Contributor (invitation message)
- **job-application**: Contributor → Startup (application message)
- **milestone-discussion**: Both parties (project-related)
- **admin-notification**: Admin → User (approval/rejection)
- **system-update**: System → User (automated updates)

---

## ⚠️ **EDGE CASES & ERROR HANDLING**

### **Edge Case 1: Contributor Already Hired by Another Startup**

**Scenario:** Startup tries to hire contributor who is already active with another startup

**Handling:**
- Check contributor's activeProjects array
- If contributor has active project:
  - Show warning: "Contributor is currently working with [Startup Name]"
  - Allow invitation but mark as "pending-availability"
  - Contributor can accept but start date is after current project ends
- If contributor is available:
  - Proceed normally

### **Edge Case 2: Multiple Applications to Same Startup**

**Scenario:** Contributor applies to multiple positions at same startup

**Handling:**
- Allow multiple applications
- Each application is separate HiringApplication
- Startup can accept one or multiple
- If startup accepts one, others can be marked "superseded"

### **Edge Case 3: Startup Runs Out of Funding**

**Scenario:** Startup's funding exhausted but milestones incomplete

**Handling:**
- System checks funding balance before milestone assignment
- If insufficient funds:
  - Prevent new milestone assignments
  - Notify startup to apply for more funding
  - Existing milestones continue
  - Contributors still get paid for completed milestones

### **Edge Case 4: Contributor Becomes Unavailable Mid-Project**

**Scenario:** Contributor changes availability to "unavailable" while active

**Handling:**
- Contributor can update availability
- If active projects exist:
  - Show warning: "You have active projects"
  - Option to mark as "busy" instead
  - Or complete/terminate active projects first
- Startup is notified if contributor becomes unavailable

### **Edge Case 5: Admin Rejects After Partial Approval**

**Scenario:** Admin rejects funding application after some milestones started

**Handling:**
- If milestones already in progress:
  - Admin cannot reject (must be "changes-requested")
  - Or admin can pause funding (milestones paused, not deleted)
- If no milestones started:
  - Can reject normally
  - Delete pending milestones

### **Edge Case 6: Contributor Submits Milestone But Startup Rejects**

**Scenario:** Contributor submits deliverable, startup reviews and rejects

**Handling:**
- Startup can reject contributor's submission
- Milestone status: 'submitted' → 'rejected-by-startup'
- Contributor can:
  - Resubmit with revisions
  - Request clarification
  - Appeal to admin (if dispute)
- Milestone remains assigned to contributor until resolved

---

## 🗄️ **DATA MODELS & RELATIONSHIPS**

### **Complete Data Model Structure:**

```typescript
// User Model (Extended)
interface IUser {
  // ... existing fields ...
  role: 'user' | 'startup' | 'contributor' | 'admin';
  startupId?: ObjectId; // If role is 'startup'
  contributorProfileId?: ObjectId; // If role is 'contributor'
}

// Startup Model
interface IStartup {
  userId: ObjectId; // Founder
  companyName: string;
  logo: string;
  description: string;
  industry: string;
  stage: 'ideation' | 'execute' | 'scale';
  fundingStatus: 'applying' | 'approved' | 'active' | 'paused' | 'completed';
  totalFunding: number;
  currentBalance: number;
  teamMembers: [{
    contributorId: ObjectId;
    role: string;
    joinedDate: Date;
    status: 'active' | 'inactive' | 'completed';
    hiringApplicationId: ObjectId;
  }];
  milestones: [ObjectId]; // Milestone IDs
  createdAt: Date;
  updatedAt: Date;
}

// Contributor Profile Model
interface IContributorProfile {
  userId: ObjectId;
  skills: [string];
  hourlyRate?: number;
  availability: 'available' | 'busy' | 'unavailable';
  portfolio: [{
    title: string;
    description: string;
    images: [string];
    link?: string;
    technologies: [string];
    isPublic: boolean;
  }];
  certifications: [{
    name: string;
    organization: string;
    url?: string;
    issueDate: Date;
  }];
  ratings: {
    average: number;
    count: number;
  };
  completedProjects: number;
  isVerified: boolean;
  bio: string;
  activeProjects: [ObjectId]; // HiringApplication IDs
  createdAt: Date;
  updatedAt: Date;
}

// Startup Application Model
interface IStartupApplication {
  userId: ObjectId;
  companyName: string;
  logo?: string;
  description: string;
  industry: string;
  stage: 'ideation' | 'execute' | 'scale';
  founderBio: string;
  websiteUrl?: string;
  businessPlan?: {
    problem: string;
    solution: string;
    targetMarket: string;
    competitiveAdvantage: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: ObjectId; // Admin ID
  reviewedAt?: Date;
  rejectionReason?: string;
  approvalNotes?: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Hiring Application Model
interface IHiringApplication {
  startupId: ObjectId;
  contributorId: ObjectId;
  jobPostingId?: ObjectId; // If from job posting
  role: string; // Job title/position
  projectDescription: string;
  compensationType: 'milestone-based' | 'fixed' | 'hourly';
  compensationAmount: number;
  startDate?: Date;
  expectedDuration?: string;
  coverLetter?: string; // If from application
  selectedPortfolio?: [ObjectId]; // Portfolio project IDs
  status: 'invited' | 'applied' | 'hired' | 'active' | 'paused' | 'completed' | 'terminated' | 'declined' | 'rejected';
  invitedAt?: Date;
  appliedAt?: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  rejectedAt?: Date;
  declineReason?: string;
  rejectionReason?: string;
  terminatedAt?: Date;
  terminationReason?: string;
  milestoneAssignments: [ObjectId]; // Milestone IDs
  createdAt: Date;
  updatedAt: Date;
}

// Funding Application Model
interface IFundingApplication {
  startupId: ObjectId;
  requestedAmount: number;
  approvedAmount?: number;
  useCase: string;
  businessJustification: string;
  milestones: [{
    title: string;
    description: string;
    fundingAmount: number;
    timeline: string; // e.g., "2 weeks", "1 month"
    successCriteria?: string;
  }];
  status: 'pending' | 'approved' | 'rejected' | 'changes-requested';
  reviewedBy?: ObjectId; // Admin ID
  reviewedAt?: Date;
  rejectionReason?: string;
  approvalNotes?: string;
  changesRequested?: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Milestone Model
interface IMilestone {
  startupId: ObjectId;
  fundingApplicationId?: ObjectId; // If from funding application
  title: string;
  description: string;
  fundingAmount: number;
  dueDate: Date;
  assignedContributors: [{
    contributorId: ObjectId;
    hiringApplicationId: ObjectId;
    expectedContribution: string;
    compensationShare: number; // Percentage of fundingAmount
  }];
  status: 'pending' | 'in-progress' | 'submitted' | 'approved-by-startup' | 'verified' | 'rejected' | 'completed';
  submission: {
    evidence: [string]; // File URLs
    description: string;
    submittedBy: ObjectId; // Contributor ID
    submittedAt: Date;
  };
  startupReview: {
    reviewedBy: ObjectId; // Startup user ID
    reviewedAt: Date;
    status: 'approved' | 'rejected';
    feedback?: string;
  };
  verification: {
    verifiedBy: ObjectId; // Admin ID
    verifiedAt: Date;
    notes: string;
  };
  fundingReleased: boolean;
  fundingReleasedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Job Posting Model (Optional - for public job postings)
interface IJobPosting {
  startupId: ObjectId;
  title: string;
  description: string;
  requiredSkills: [string];
  compensationType: 'milestone-based' | 'fixed' | 'hourly';
  compensationAmount: number;
  expectedDuration?: string;
  applicationDeadline?: Date;
  status: 'open' | 'closed' | 'filled';
  applicantCount: number;
  postedAt: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### **Relationship Diagram:**

```
User (1) ──→ (1) Startup
User (1) ──→ (1) ContributorProfile
User (1) ──→ (1) StartupApplication

Startup (1) ──→ (N) HiringApplication
ContributorProfile (1) ──→ (N) HiringApplication

Startup (1) ──→ (N) FundingApplication
FundingApplication (1) ──→ (N) Milestone

Startup (1) ──→ (N) Milestone
HiringApplication (1) ──→ (N) Milestone (via milestoneAssignments)

Milestone (N) ──→ (N) Contributor (via assignedContributors)
```

---

## 🔌 **API ENDPOINTS & PERMISSIONS**

### **Contributor Endpoints:**

```
POST   /api/contributor/apply
  - Create contributor profile
  - Role: 'user'
  - Returns: ContributorProfile

GET    /api/contributor/profile
  - Get own profile
  - Role: 'contributor'

PUT    /api/contributor/profile
  - Update own profile
  - Role: 'contributor'

GET    /api/contributors
  - List all contributors (public)
  - Role: any (public)
  - Query params: skills, availability, rating, page, limit

GET    /api/contributors/:id
  - Get contributor profile (public view)
  - Role: any (public)

GET    /api/contributor/applications
  - Get own hiring applications
  - Role: 'contributor'

POST   /api/contributor/applications/:id/accept
  - Accept hiring invitation
  - Role: 'contributor'
  - Status: 'invited'

POST   /api/contributor/applications/:id/decline
  - Decline hiring invitation
  - Role: 'contributor'
  - Status: 'invited'

POST   /api/contributor/jobs/:jobId/apply
  - Apply to job posting
  - Role: 'contributor'
```

### **Startup Endpoints:**

```
POST   /api/startup/apply
  - Submit startup application
  - Role: 'user'
  - Returns: StartupApplication

GET    /api/startup/profile
  - Get own startup profile
  - Role: 'startup'

PUT    /api/startup/profile
  - Update own profile
  - Role: 'startup'

GET    /api/startups
  - List all startups (public)
  - Role: any (public)

GET    /api/startups/:id
  - Get startup profile (public view)
  - Role: any (public)

GET    /api/startup/applications
  - Get hiring applications (received)
  - Role: 'startup'

POST   /api/startup/contributors/:id/invite
  - Send hiring invitation
  - Role: 'startup'
  - Body: { role, projectDescription, compensationType, compensationAmount }

POST   /api/startup/applications/:id/accept
  - Accept contributor application
  - Role: 'startup'
  - Status: 'applied'

POST   /api/startup/applications/:id/reject
  - Reject contributor application
  - Role: 'startup'
  - Status: 'applied'

POST   /api/startup/funding/apply
  - Submit funding application
  - Role: 'startup'

GET    /api/startup/funding/applications
  - Get own funding applications
  - Role: 'startup'

GET    /api/startup/team
  - Get team members
  - Role: 'startup'

POST   /api/startup/jobs
  - Create job posting
  - Role: 'startup'
```

### **Admin Endpoints:**

```
GET    /api/admin/startup-applications
  - List all startup applications
  - Role: 'admin'
  - Query: status, page, limit

GET    /api/admin/startup-applications/:id
  - Get startup application details
  - Role: 'admin'

POST   /api/admin/startup-applications/:id/approve
  - Approve startup application
  - Role: 'admin'
  - Body: { approvalNotes? }

POST   /api/admin/startup-applications/:id/reject
  - Reject startup application
  - Role: 'admin'
  - Body: { rejectionReason }

GET    /api/admin/funding-applications
  - List all funding applications
  - Role: 'admin'

GET    /api/admin/funding-applications/:id
  - Get funding application details
  - Role: 'admin'

POST   /api/admin/funding-applications/:id/approve
  - Approve funding application
  - Role: 'admin'
  - Body: { approvedAmount?, milestones?, approvalNotes? }

POST   /api/admin/funding-applications/:id/reject
  - Reject funding application
  - Role: 'admin'
  - Body: { rejectionReason }

GET    /api/admin/contributors
  - List all contributors (admin view)
  - Role: 'admin'

GET    /api/admin/hiring-applications
  - List all hiring applications
  - Role: 'admin'
```

### **Milestone Endpoints:**

```
POST   /api/milestones
  - Create milestone (from funding application)
  - Role: 'admin' (when approving funding)
  - Or: 'startup' (if creating custom milestone)

GET    /api/milestones
  - List milestones
  - Role: 'startup' (own), 'contributor' (assigned), 'admin' (all)

GET    /api/milestones/:id
  - Get milestone details
  - Role: 'startup' | 'contributor' | 'admin'

POST   /api/milestones/:id/assign
  - Assign milestone to contributor
  - Role: 'startup'
  - Body: { contributorId, hiringApplicationId, compensationShare }

POST   /api/milestones/:id/submit
  - Submit milestone deliverable
  - Role: 'contributor'
  - Body: { evidence: [fileUrls], description }

POST   /api/milestones/:id/review
  - Review contributor submission
  - Role: 'startup'
  - Body: { status: 'approved' | 'rejected', feedback? }

POST   /api/milestones/:id/verify
  - Verify milestone completion
  - Role: 'admin'
  - Body: { notes }

POST   /api/milestones/:id/release-funding
  - Release funding for verified milestone
  - Role: 'admin' (or automated)
```

---

## 📝 **NOTES & CONSIDERATIONS**

### **Auto-Approval vs Manual Approval:**

**Recommendation for MVP:**
- **Contributor Applications**: Auto-approve (instant activation)
- **Startup Applications**: Require admin approval (quality control)
- **Funding Applications**: Require admin approval (financial control)

**Future Enhancement:**
- Add verification levels (verified, premium, etc.)
- Contributor verification badges
- Startup credibility scores

### **Notification Strategy:**

- **Critical**: Email + In-app (approvals, rejections, hiring decisions)
- **Important**: In-app only (applications, invitations, messages)
- **Informational**: In-app only (milestone updates, status changes)

### **Security Considerations:**

- Role-based access control at API level
- Verify ownership before actions (startup can only manage own data)
- Admin actions logged for audit trail
- Sensitive data (payment info) encrypted
- File uploads validated and scanned

### **Performance Considerations:**

- Index database fields: userId, startupId, contributorId, status
- Paginate large lists (applications, contributors, startups)
- Cache frequently accessed data (contributor directory)
- Lazy load detailed views

---

## ✅ **IMPLEMENTATION CHECKLIST**

### **Phase 1: Foundation**
- [ ] Add 'startup' and 'contributor' roles to User model
- [ ] Create ContributorProfile model
- [ ] Create Startup model
- [ ] Create StartupApplication model
- [ ] Create HiringApplication model
- [ ] Update role enum in backend
- [ ] Create contributor application form (frontend)
- [ ] Create startup application form (frontend)
- [ ] Contributor directory page (public)
- [ ] Startup directory page (public)

### **Phase 2: Hiring System**
- [ ] Hiring invitation flow (startup → contributor)
- [ ] Job application flow (contributor → startup)
- [ ] Application acceptance/rejection
- [ ] Team management interface
- [ ] Hiring application status tracking

### **Phase 3: Admin Approval**
- [ ] Admin dashboard for startup applications
- [ ] Admin dashboard for funding applications
- [ ] Approval/rejection workflows
- [ ] Notification system
- [ ] Admin action logging

### **Phase 4: Integration**
- [ ] Integrate with existing messaging system
- [ ] Connect to payment system
- [ ] Add notification triggers
- [ ] File upload for portfolios/evidence
- [ ] Search and filter functionality

---

**END OF DOCUMENT**

This comprehensive analysis covers every angle of the hiring and approval flows. Use this as the blueprint for implementation.
