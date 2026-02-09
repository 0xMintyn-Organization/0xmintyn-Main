# Complete Milestone: How and Where They Are Used

This document describes the **milestone** feature end-to-end: status flow, backend APIs/models, frontend pages, and every place milestones are referenced in the codebase.

---

## 1. Status Lifecycle

```
Open → In Progress → Completed → Submitted → Paid | Rejected
```

| Status        | Who sets it   | Meaning |
|---------------|---------------|--------|
| **Open**      | Startup       | Milestone created; no contributor assigned |
| **In Progress** | Startup     | Contributor assigned; work in progress |
| **Completed** | Contributor   | Contributor marked work as done |
| **Submitted** | Startup       | Startup submitted to admin for funding |
| **Paid**      | Admin         | Admin approved; funding released (payment record created) |
| **Rejected**  | Admin         | Admin rejected funding |

Valid transitions are enforced in the backend; invalid transitions return 400.

---

## 2. Backend

### 2.1 Model

**File:** `Backend/models/milestone.model.ts`

- **Collection:** `Milestone`
- **Fields:**
  - `startupId` (ObjectId, ref User) – creator
  - `title` (string, required)
  - `description` (string, optional)
  - `amount` (number, required, min 0)
  - `status` (enum: Open | In Progress | Completed | Submitted | Paid | Rejected)
  - `assignedContributorId` (ObjectId, ref User, optional)
  - `completedAt`, `submittedAt`, `paidAt`, `rejectedAt` (Date, optional)
  - `createdAt`, `updatedAt` (timestamps)
- **Indexes:** `startupId + status`, `status`, `assignedContributorId + status`

### 2.2 Routes & Base Path

**File:** `Backend/routes/milestone.route.ts`  
**Base path:** `Backend/app.ts` → `/api/v1/milestone`

| Method | Path        | Handler           | Auth |
|--------|-------------|-------------------|------|
| GET    | `/`         | listMilestones    | Yes  |
| POST   | `/`         | createMilestone   | Yes  |
| GET    | `/:id`      | getMilestoneById  | Yes  |
| PATCH  | `/:id`      | patchMilestone    | Yes  |

### 2.3 Controller Actions

**File:** `Backend/controllers/milestone.controller.ts`

| Handler           | Purpose |
|-------------------|--------|
| **listMilestones** | **Admin:** milestones with status `Submitted` or `Paid`. **Startup:** own milestones. **Contributor:** milestones where user is `assignedContributorId`. |
| **createMilestone** | **Startup only.** Body: `title`, `description`, `amount`. Creates milestone with `status: 'Open'`. |
| **getMilestoneById** | Returns milestone if user is owner (startup), admin, or assigned contributor. |
| **patchMilestone** | Handles: (1) **Assign contributor** when status is `Open`: sets `assignedContributorId` (must be hired via Engagement) and status `In Progress`. (2) **Status change** via `canTransition()`: Open→In Progress (startup), In Progress→Completed (contributor), Completed→Submitted (startup), Submitted→Paid|Rejected (admin). Sets `completedAt`/`submittedAt`/`paidAt`/`rejectedAt` when status changes. When status becomes **Paid**, creates one **MilestonePayment** record. |

### 2.4 MilestonePayment (Funding Record)

**File:** `Backend/models/milestonePayment.model.ts`  
**Routes:** `Backend/routes/milestonePayment.route.ts` → `/api/v1/milestone-payment`

- Created automatically when admin sets milestone status to **Paid**.
- Stores: `milestoneId`, `startupId`, `amount`, `milestoneTitle`, `startupName`, `payment_info` (e.g. manual/completed), `paidAt`.
- Used for “funding received” history; no real payment gateway wired.

### 2.5 Other Backend Uses of Milestones

| File | How milestones are used |
|------|--------------------------|
| `Backend/controllers/engagement.controller.ts` | **Engagement analytics (contributor):** `MilestoneModel.find({ assignedContributorId: userId, status: { $in: ['Completed', 'Submitted', 'Paid'] } })` to compute `totalEarned`, `completedMilestonesCount`, etc. |
| `Backend/controllers/startupProfile.controller.ts` | **getStartupProfileMilestones:** `MilestoneModel.find({ startupId, status: { $in: ['Open', 'In Progress'] } })` for public startup profile page (approved profiles only). |
| `Backend/controllers/contributorPayout.controller.ts` | Payouts can reference `milestoneId` (contributor paid for a milestone). |
| `Backend/models/contributorPayout.model.ts` | Optional `milestoneId` (ref Milestone). |

---

## 3. Frontend API Layer

**File:** `Frontend/src/lib/marketplaceApi.ts`

- **Base URL:** `NEXT_PUBLIC_SERVER_URI` or `https://localhost:8000/api/v1`
- **milestones:**
  - `list()` → GET `/milestone`
  - `create(body)` → POST `/milestone` — body: `{ title, description?, amount }`
  - `get(id)` → GET `/milestone/:id`
  - `patch(id, body)` → PATCH `/milestone/:id` — body: `{ status?, assignedContributorId? }`
- **milestonePayment:** `list()` → GET `/milestone-payment`
- **startupProfile.getMilestones(profileId)** → GET `/startup-profile/:profileId/milestones` (public Open/In Progress milestones for that startup).

---

## 4. Frontend Pages and Usage

### 4.1 Startup: Create & List Milestones

**File:** `Frontend/src/app/(startup)/startup/milestones/page.tsx`  
**Route:** `/startup/milestones`

- **List:** `marketplaceApi.milestones.list()` → shows all milestones for the startup.
- **Create:** Form (title, description, amount) → `marketplaceApi.milestones.create({ title, description, amount })`.
- **Navigation:** Each milestone links to `/startup/milestones/[id]`.

### 4.2 Startup: Milestone Detail (Assign, Submit for Funding)

**File:** `Frontend/src/app/(startup)/startup/milestones/[id]/page.tsx`  
**Route:** `/startup/milestones/[id]`

- **Load:** `marketplaceApi.milestones.get(id)` and `marketplaceApi.engagement.list()` (for dropdown of hired contributors).
- **Open:** Dropdown to select contributor → “Assign & mark in progress” → `patch(id, { assignedContributorId, status: "In Progress" })`.
- **In Progress:** Message that contributor is working.
- **Completed:** “Submit for funding” → `patch(id, { status: "Submitted" })`.
- **Submitted / Paid / Rejected:** Status message only.

### 4.3 Contributor: My Milestones (Mark Complete)

**File:** `Frontend/src/app/(userdashboard)/marketplace/milestones/page.tsx`  
**Route:** `/marketplace/milestones`

- **Access:** Contributor only (redirects others to `/marketplace/startups`).
- **List:** `marketplaceApi.milestones.list()` (backend returns only assigned milestones for contributor).
- **Action:** For status “In Progress”, “Mark complete” → `patch(id, { status: "Completed" })`.

### 4.4 Admin: Funding (Approve / Reject)

**File:** `Frontend/src/app/(userdashboard)/admin/funding/page.tsx`  
**Route:** `/admin/funding`

- **List milestones:** `marketplaceApi.milestones.list()` (admin gets Submitted + Paid).
- **Submitted:** “Approve & pay” → `patch(milestoneId, { status: "Paid" })`; “Reject” → `patch(milestoneId, { status: "Rejected" })`.
- **Payment history:** `marketplaceApi.milestonePayment.list()`.

### 4.5 Startup: Funding Received

**File:** `Frontend/src/app/(startup)/startup/funding/page.tsx`  
**Route:** `/startup/funding`

- **List:** `marketplaceApi.milestonePayment.list()` — shows funding received from admin for paid milestones.
- Copy references “completed milestones” and “admin approve funding”.

### 4.6 Public Startup Profile (Browse Startups)

**File:** `Frontend/src/app/(userdashboard)/marketplace/startups/[id]/page.tsx`  
**Route:** `/marketplace/startups/[id]`

- **Milestones section:** `marketplaceApi.startupProfile.getMilestones(id)` — shows **Open** and **In Progress** milestones for that startup (read-only, to attract contributors).

### 4.7 Other Frontend References

| File | Usage |
|------|--------|
| `Frontend/src/components/Sidebar/SidebarContent.tsx` | “My milestones” link → `/marketplace/milestones`; admin “Funding” → “Approve completed milestones”. |
| `Frontend/src/app/(startup)/layout.tsx` | “Milestones” nav → `/startup/milestones`. |
| `Frontend/src/app/(startup)/startup/dashboard/page.tsx` | Links to “Milestones” and “Funding received”. |
| `Frontend/src/app/(startup)/startup/team/page.tsx` | Link “View milestones” → `/startup/milestones`. |
| `Frontend/src/app/(startup)/startup/hiring/page.tsx` | Link to `/startup/milestones`. |
| `Frontend/src/app/(userdashboard)/marketplace/contributors/page.tsx` | Copy: “apply to startups and get assigned milestones”. |
| `Frontend/src/app/(userdashboard)/marketplace/work/page.tsx` | Type only: `milestoneId?: { title?: string }`. |
| `Frontend/src/app/(startup)/startup/verification/page.tsx` | Redirects to `/startup/milestones`. |

---

## 5. Flow Summary (Who Does What)

| Step | Actor       | Action | API / Page |
|------|------------|--------|------------|
| 1    | Startup    | Create milestone (title, description, amount) | POST `/milestone` · `/startup/milestones` |
| 2    | Startup    | Assign hired contributor & set In Progress | PATCH `/milestone/:id` · `/startup/milestones/[id]` |
| 3    | Contributor| Mark complete | PATCH `/milestone/:id` { status: "Completed" } · `/marketplace/milestones` |
| 4    | Startup    | Submit for funding | PATCH `/milestone/:id` { status: "Submitted" } · `/startup/milestones/[id]` |
| 5    | Admin      | Approve (Paid) or Reject | PATCH `/milestone/:id` { status: "Paid" \| "Rejected" } · `/admin/funding` |
| 6    | Backend    | On Paid: create MilestonePayment | Inside `patchMilestone` |
| 7    | Startup    | View funding received | GET `/milestone-payment` · `/startup/funding` |

---

## 6. Related Features

- **Engagement:** Must exist (startup hired contributor) before a contributor can be assigned to a milestone.
- **Contributor payouts:** Startups can pay contributors (optionally linked to a milestone via `milestoneId`) from `/startup/team` and contributor payout APIs.
- **Governance/Proposals:** The word “milestones” in proposal timeline (e.g. `ProposalForm.tsx`, `ProposalDetails.tsx`) is a different concept (implementation milestones text), not the marketplace Milestone model.

---

## 7. Solana / Anchor (Smart Contract)

**Directory:** `Smart/milestone/`

- Separate **on-chain** milestone program (Anchor); not wired to the backend or frontend above.
- Backend and frontend milestones are **database-driven** (MongoDB + REST); funding release is recorded in `MilestonePayment`, not on-chain.

---

*Last summarized from the codebase: Backend (milestone + milestonePayment models, controllers, routes), Frontend (marketplaceApi, startup/contributor/admin/startup-profile pages), and related engagement/analytics usage.*
