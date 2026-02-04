# Startup–Contributor Module — Deep Analysis

This document is a **full-stack analysis** of the startup–contributor (marketplace) module: backend APIs, frontend pages, admin flows, contributor flows, and startup (user) flows. Use it to debug, extend, or onboard.

---

## 1. Architecture Overview

### 1.1 Concepts

| Concept | Meaning |
|--------|---------|
| **User** | One account (email/password). Has `role` (e.g. `user`, `admin`) and optional `marketplace_role` (`startup` \| `contributor`). |
| **Startup** | User with `marketplace_role === 'startup'`. Can create startup profile, milestones, hire contributors, receive funding. |
| **Contributor** | User with `marketplace_role === 'contributor'`. Can have contributor profile, apply to startups, receive payouts. |
| **StartupProfile** | Extended profile for a startup user (company name, description, status `pending`/`approved`/`rejected`). One per startup user. |
| **ContributorProfile** | Extended profile for a contributor (skills, bio, portfolio, payment method). One per contributor user. |
| **Application** | Contributor → Startup: “I want to work with you.” Status: `pending`, `accepted`, `rejected`. One active application per (startup, contributor) pair; rejected can re-apply. |
| **Engagement** | After application is accepted: working relationship (start/end date, agreed salary). One engagement per (startup, contributor). |
| **Milestone** | Created by startup; has title, description, amount, status: `Open` → `In Progress` → `Completed` → `Paid`. Only admin can set `Paid`. |
| **ContributorPayout** | Startup records a payout to a contributor (amount, optional note). Used for salary/outcome payments. |
| **MilestonePayment** | Record created when admin marks a milestone as `Paid` (funding released to startup). |

### 1.2 High-Level Data Flow

```
[Contributor]                    [Startup]                         [Admin]
     |                                |                                 |
     | 1. Apply (startupId=user id)  |                                 |
     |------------------------------>|                                 |
     |     Application (pending)      |                                 |
     |                                | 2. Accept / Reject               |
     |                                |---------> Application (accepted) |
     |                                | 3. Engagement created (auto)     |
     |                                | 4. Team: set dates, salary       |
     |                                | 5. Send payout (contributor)      |
     |<-------------------------------|                                 |
     |     ContributorPayout         |                                 |
     |                                | 6. Create Milestone              |
     |                                | 7. Open → In Progress → Complete |
     |                                | 8. Request funding               |
     |                                |------------------------------->|
     |                                |         Admin: mark Paid         |
     |                                |<-------------------------------|
     |                                |     MilestonePayment created     |
```

---

## 2. Backend — Routes & Mounting

All under `/api/v1`:

| Mount path | Router | Purpose |
|------------|--------|---------|
| (none) | userRouter | `/me`, `/register`, `/login`, `/session-from-code`, `/logout`, `/refreshtoken`, `/me/onboarding/startup`, `/me/onboarding/contributor`, etc. |
| `/startup-profile` | startupProfileRouter | Startup profile CRUD + list + admin list + status patch |
| `/contributor-profile` | contributorProfileRouter | Contributor profile CRUD + list |
| `/milestone` | milestoneRouter | List / create / get / patch milestones |
| `/milestone-payment` | milestonePaymentRouter | List (admin: all; startup: own) |
| `/application` | applicationRouter | List my applications, create (contributor), patch (startup/admin) |
| `/contributor-payout` | contributorPayoutRouter | List (startup/contributor), create (startup) |
| `/engagement` | engagementRouter | List, get by id, put (create/update), analytics |
| `/messenger` | messengerRouter | Conversations and messages (startup ↔ contributor) |

---

## 3. Backend — Controllers & Role Checks

### 3.1 Startup Profile (`startupProfile.controller.ts`)

| Endpoint | Who | Behavior |
|----------|-----|----------|
| `GET /` | Startup (marketplace_role === 'startup') | Own profile; create empty if not exists. |
| `PUT /` | Startup | Create/update own profile (companyName, description, image, fundingState, contact, aim, positionsHiring, personsNeeded, paymentMethod, status). Syncs image to `user.startupImageUrl`. |
| `GET /:id` | Any authenticated | Own or admin: full profile. Others: only if status === 'approved', public fields only. |
| `GET /:id/milestones` | Any | Public milestones (Open, In Progress) for **approved** startup profile. |
| `GET /list` | Any | List **approved** startup profiles (showcase). |
| `GET /list/admin` | **Admin only** | List all startup profiles (pending/approved/rejected). |
| `PATCH /:id` | **Admin only** | Set profile status: `pending` \| `approved` \| `rejected`. |

**Important:** New startup profiles can be created with `status: 'approved'` by default in code; admin can later reject. Only **approved** profiles appear in `/list` and in the marketplace “Startups” list on the frontend.

### 3.2 Contributor Profile (`contributorProfile.controller.ts`)

| Endpoint | Who | Behavior |
|----------|-----|----------|
| `GET /` | Contributor | Own profile; create empty if not exists. |
| `PUT /` | Contributor | Create/update own (image, headline, bio, experience, location, skills, portfolio, availability, linkedIn, website, github, paymentMethod, earningsSummary). |
| `GET /list` | Any | List all contributor profiles (public-safe fields). **No admin-only list.** |
| `GET /:id` | Any | Own: full profile. Others: public fields only. |

**Gap:** There is no admin-only “list all contributors” or “patch contributor profile status” equivalent to startup profiles. Contributors are always listable once they have a profile.

### 3.3 Application (`application.controller.ts`)

| Endpoint | Who | Behavior |
|----------|-----|----------|
| `POST /` | **Contributor only** | Create application: body `startupId` (User._id of startup), optional coverMessage, cvUrl, monthlySalary. Rejected can re-apply (same pair: status set back to pending). |
| `PATCH /:id` | **Startup owner** or **Admin** | Set status: `accepted` \| `rejected`. On `accepted`, an Engagement is created if not exists. |
| `GET /` | Contributor or Startup | Contributor: my applications to startups. Startup: applications to me. |

**Note:** `startupId` in the API is the **User** `_id` of the startup, not the StartupProfile `_id`. Frontend correctly uses `profile.userId` (user id) when applying.

### 3.4 Milestone (`milestone.controller.ts`)

| Endpoint | Who | Behavior |
|----------|-----|----------|
| `GET /` | Admin: milestones with status Completed or Paid. Startup: own milestones. Contributor: empty list (no assign-to-contributor flow). | |
| `POST /` | **Startup only** | Create: title, description, amount; status `Open`. |
| `GET /:id` | Startup owner or Admin | Get one. |
| `PATCH /:id` | Startup or Admin | Status transitions: Open → In Progress → Completed (startup); Completed → Paid (admin only). On Paid, MilestonePayment record is created. |

**Valid transitions:** Open → In Progress → Completed (startup); Completed → Paid (admin). Contributor cannot change milestone status from the API (no “mark complete” by contributor in backend).

### 3.5 Engagement (`engagement.controller.ts`)

| Endpoint | Who | Behavior |
|----------|-----|----------|
| `GET /` | Startup or Contributor | List my engagements. |
| `GET /:id` | Startup (own) or Contributor (own) | Get one. |
| `PUT /` | **Startup only** | Create or update engagement: contributorId (must be accepted for this startup), startDate, endDate, agreedSalary, status, note. |
| `GET /analytics` | Startup or Contributor | Startup: total paid to contributors, by contributor. Contributor: total earned, received, pending, by month. |

### 3.6 Contributor Payout (`contributorPayout.controller.ts`)

| Endpoint | Who | Behavior |
|----------|-----|----------|
| `GET /` | Startup or Contributor | Startup: payouts I sent. Contributor: payouts I received. |
| `POST /` | **Startup only** | Create payout: contributorId (must be hired), amount, optional milestoneId, note. |

### 3.7 Milestone Payment (`milestonePayment.controller.ts`)

| Endpoint | Who | Behavior |
|----------|-----|----------|
| `GET /` | **Admin**: all. **Startup**: own. | Funding received by startup (when admin marks milestone Paid). |

---

## 4. Frontend — Route Structure

### 4.1 Layouts

- **`(userdashboard)`** — Main app layout: sidebar (SidebarContent), Protected. Used for `/dashboard`, `/marketplace/*`, `/admin/*`, etc. **Startup users** are redirected to `/startup/dashboard` by `useProtected` (so they don’t see this layout for main dashboard).
- **`(startup)`** — Startup layout: startup nav (Dashboard, Profile, Milestones, Hiring, Team, Funding, Messenger), Protected, **only for users with** `marketplace_role === 'startup'` or `startupName` set (see `isStartupUser` in `lib/onboarding.ts`).

### 4.2 Key Routes

| Route | Layout | Who can see | Purpose |
|-------|--------|-------------|---------|
| `/dashboard` | (userdashboard) | Non-startup (contributor, admin, plain user) | Main dashboard. Startups are redirected to `/startup/dashboard`. |
| `/startup/dashboard` | (startup) | Startup only | Startup hub home. |
| `/startup/profile` | (startup) | Startup | Edit startup profile (calls `startup-profile` PUT). |
| `/startup/milestones` | (startup) | Startup | List/create/patch own milestones. |
| `/startup/milestones/[id]` | (startup) | Startup | View/edit one milestone (status transitions). |
| `/startup/hiring` | (startup) | Startup | List applications (pending/accepted/rejected), Accept/Reject. |
| `/startup/team` | (startup) | Startup | Engagements, set up engagement for accepted contributors, edit engagement, “Send salary” (record payout). |
| `/startup/funding` | (startup) | Startup | List own milestone payments (funding received). |
| `/startup/messenger` | (startup) | Startup | Conversations (with contributors). |
| `/marketplace/startups` | (userdashboard) | All | List approved startup profiles. |
| `/marketplace/startups/[id]` | (userdashboard) | All | Startup profile detail; **contributors** see “Apply to this startup” (startupId = profile.userId). |
| `/marketplace/contributors` | (userdashboard) | All | List contributor profiles. |
| `/marketplace/contributors/[id]` | (userdashboard) | All | Contributor profile detail. |
| `/marketplace/work` | (userdashboard) | Contributor (others see “Only contributors” message) | Connected startup, payouts received. |
| `/marketplace/my-applications` | (userdashboard) | Contributor | My applications (pending/accepted/rejected). |
| `/marketplace/contributor-profile` | (userdashboard) | Contributor | Edit my contributor profile. |
| `/marketplace/milestones` | (userdashboard) | All? | Marketplace milestones view (check page for role logic). |
| `/admin/startup-profiles` | (userdashboard) | **Admin only** (AdminProtected) | List all startup profiles, Approve/Reject, View. |
| `/admin/funding` | (userdashboard) | **Admin only** | List completed milestones, “Paid & proceed” to mark Paid; list milestone payment history. |

---

## 5. Frontend — API Usage (`lib/marketplaceApi.ts`)

All requests use `credentials: 'include'` (cookies). Base URL: `NEXT_PUBLIC_SERVER_URI`.

- **milestones**: list, create, get, patch
- **contributorPayout**: list, create
- **engagement**: list, get, put, analytics
- **milestonePayment**: list
- **applications**: list, create, patch
- **messenger**: listConversations, getOrCreateConversation, listMessages, sendMessage
- **startupProfile**: get, put, list, listAdmin, patchStatus, getById, getMilestones
- **contributorProfile**: get, put, list, getById

**Apply flow:** Contributor on `/marketplace/startups/[id]` uses `profile.userId` (startup **user** id) as `startupId` when calling `applications.create`. Backend expects `startupId` = User._id. Correct.

---

## 6. Admin Flows (Summary)

1. **Startup profiles**  
   - **Admin Panel** → “Startup profiles” → `/admin/startup-profiles`.  
   - Lists all startups (pending / approved / rejected).  
   - Actions: Approve, Reject, View (links to `/marketplace/startups/:profileId`).  
   - Only **approved** profiles appear in marketplace “Startups” list.

2. **Funding**  
   - **Admin Panel** → “Funding” → `/admin/funding`.  
   - Lists **completed** milestones (from `milestone` list API; backend returns only Completed/Paid for admin).  
   - “Paid & proceed” → PATCH milestone status to `Paid` → backend creates MilestonePayment.  
   - Payment history section lists all milestone payments.

**Missing (optional):**  
- No admin list of **all applications** (e.g. filter by startup/contributor).  
- No admin list of **all engagements** or **all contributor payouts**.  
- No admin “contributor profiles” moderation (no approve/reject for contributors).

---

## 7. Contributor Flows (Summary)

1. **Profile**  
   - `/marketplace/contributor-profile` → GET/PUT own contributor profile (create if missing).

2. **Discover & apply**  
   - `/marketplace/startups` → list approved startups.  
   - `/marketplace/startups/[id]` → view startup, open “Apply” dialog, submit cover message, CV URL, optional monthly salary → `applications.create({ startupId: startupUserId, ... })`.

3. **My applications**  
   - `/marketplace/my-applications` → list my applications (pending/accepted/rejected).

4. **My work**  
   - `/marketplace/work` → if accepted: “Connected startup” and list of **payouts** received (from `contributor-payout` list).  
   - No dedicated “my engagements” page; engagement data could be added from `engagement.list()` and `engagement.analytics()`.

5. **Messenger**  
   - Link to messenger with startup from startup detail page (`/messenger?with=startupUserId`).

**Backend:** Contributor can only list **own** applications, engagements, payouts. No list-all for contributors.

---

## 8. Startup (User) Flows (Summary)

1. **Dashboard**  
   - `/startup/dashboard` → links to Profile, Milestones, Hiring, Team, Funding.

2. **Profile**  
   - `/startup/profile` → GET/PUT own startup profile.  
   - **Note:** New profile may be created with default `status: 'approved'` in backend (startupProfile create path). If you want “pending until admin approves”, backend should set default `status: 'pending'` and admin approves from `/admin/startup-profiles`.

3. **Milestones**  
   - `/startup/milestones` → list, create.  
   - `/startup/milestones/[id]` → view, patch status (Open → In Progress → Completed).  
   - **Paid** is only set by admin in `/admin/funding`.

4. **Hiring**  
   - `/startup/hiring` → list applications to this startup; Accept / Reject.  
   - Accept → backend creates Engagement automatically.

5. **Team**  
   - `/startup/team` → list engagements, “Set up engagement” for accepted-without-engagement, edit start/end/salary, “Send salary” (create contributor payout).  
   - Links to Milestones and Funding.

6. **Funding**  
   - `/startup/funding` → list **milestone payments** (funding received when admin marked milestones Paid).

7. **Messenger**  
   - `/startup/messenger` → conversations with contributors.

**Backend:** Startup can only list own milestones, applications (to me), engagements, payouts (sent), milestone payments (own).

---

## 9. Role & Access Matrix (Backend)

| API / Resource | Admin | Startup | Contributor |
|----------------|-------|--------|-------------|
| GET/PUT own startup profile | — | ✅ | — |
| GET startup by id (public) | ✅ full | ✅ own full | ✅ public if approved |
| GET list startups | — | — | ✅ approved only |
| GET list startups admin | ✅ | — | — |
| PATCH startup status | ✅ | — | — |
| GET/PUT own contributor profile | — | — | ✅ |
| GET contributor list | — | ✅ | ✅ |
| POST application | — | — | ✅ |
| PATCH application | ✅ (and startup) | ✅ own | — |
| GET my applications | — | ✅ to me | ✅ mine |
| GET/POST milestone | ✅ list Completed/Paid | ✅ own CRUD | — (empty list) |
| PATCH milestone | ✅ Paid | ✅ Open→…→Completed | — |
| GET milestone-payment | ✅ all | ✅ own | — |
| GET/PUT engagement | — | ✅ | ✅ own list/get |
| GET engagement analytics | — | ✅ | ✅ |
| GET/POST contributor-payout | — | ✅ | ✅ list received |

---

## 10. Potential Gaps & Inconsistencies

1. **Startup profile default status**  
   - In `startupProfile.controller.ts`, new profiles can be created with `status: 'approved'`. If you want “pending until admin approves”, set default to `'pending'` and ensure only approved appear in `/list` (already the case).

2. **Contributor list is public**  
   - `contributor-profile/list` returns all contributor profiles (public fields). There is no “approved/rejected” for contributors. If you need moderation, you’d add a status field and admin-only list/patch.

3. **Milestone assignment to contributor (removed)**  
   - The assign-to-contributor flow has been removed. Contributors get an empty milestone list; contributor analytics use only payouts (totalReceived). Model keeps `assignedContributorId` for DB compatibility but it is not used in listing or analytics.

4. **Messenger**  
   - Conversation/message APIs exist; frontend has messenger pages for both dashboard and startup. Ensure `otherUserId` in getOrCreateConversation is the **User** id (startup or contributor) as expected by backend.

5. **Admin sidebar**  
   - Sidebar shows “Startup profiles” and “Funding” for admin. No “Applications” or “Engagements” or “Contributor payouts” in admin menu; add if you need global oversight.

6. **useProtected vs startup layout**  
   - Startup users are redirected to `/startup/*` and never see the main dashboard sidebar. So “Marketplace” in sidebar (Startups, Contributors, My work, My applications, Contributor profile) is for **contributors** (and admins). Startups use the (startup) layout only.

---

## 11. File Reference (Quick)

**Backend**  
- Routes: `routes/startupProfile.route.ts`, `contributorProfile.route.ts`, `application.route.ts`, `milestone.route.ts`, `milestonePayment.route.ts`, `contributorPayout.route.ts`, `engagement.route.ts`, `messenger.route.ts`  
- Controllers: same names under `controllers/`  
- Models: `models/startupProfile.model.ts`, `contributorProfile.model.ts`, `application.model.ts`, `milestone.model.ts`, `milestonePayment.model.ts`, `contributorPayout.model.ts`, `engagement.model.ts`, `user.mode.ts`

**Frontend**  
- API: `lib/marketplaceApi.ts`  
- Onboarding/role: `lib/onboarding.ts`, `hooks/useProtected.tsx`, `contexts/AuthContext.tsx`  
- Sidebar/nav: `components/Sidebar/SidebarContent.tsx`  
- Startup pages: `app/(startup)/startup/*` (dashboard, profile, milestones, hiring, team, funding, messenger)  
- Contributor/marketplace: `app/(userdashboard)/marketplace/*` (startups, contributors, work, my-applications, contributor-profile, milestones)  
- Admin: `app/(userdashboard)/admin/startup-profiles/page.tsx`, `admin/funding/page.tsx`  
- Role guard: `components/RoleProtected.tsx` (AdminProtected, AllRolesProtected)

---

## 12. Recommendations

1. **Decide startup profile default**  
   - If new startups should wait for admin approval before appearing in marketplace, set new StartupProfile `status: 'pending'` and rely on admin to approve from `/admin/startup-profiles`.

2. **Milestone assignment (not used)**  
   - Do not re-add. Assignment and contributor mark-complete were removed. Startup creates and marks milestones; admin marks Paid.
3. **Optional: Admin views**  
   - Add admin-only lists for applications, engagements, or contributor payouts if you need full oversight.

4. **Contributor profile moderation**  
   - If you need it, add `status` to ContributorProfile and admin list/patch (similar to startup profiles).

5. **Tests**  
   - Add integration tests for: contributor apply → startup accept → engagement created → startup records payout; startup creates milestone → marks complete → admin marks paid → startup sees milestone payment.

---

This should give you a single place to reason about the whole startup–contributor module from admin, contributor, and startup sides. If you tell me which part you’re stuck on (e.g. “apply not showing for startup”, “admin can’t approve”, “payout not listing”), we can trace that path in this doc and in the code.
