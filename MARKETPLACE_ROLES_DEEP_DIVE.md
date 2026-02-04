# Marketplace Roles — Very Deep Dive

This document is a **line-level analysis** of how **marketplace_role** (and related **role**) are used across the entire app. Use it when you need to trace exactly why a user can or cannot do something, or when debugging role/marketplace issues.

---

## 1. The Two Systems (Recap)

| Field | Source | Values | Used for |
|-------|--------|--------|----------|
| **role** | `User.role` | `user`, `instructor`, `admin`, `influencer` | Platform: courses, admin panel, governance, influencer analytics. **Route middleware** (requireAdmin, requireRole). |
| **marketplace_role** | `User.marketplace_role` | `startup`, `contributor`, or `null` (schema default can be `contributor`) | Marketplace: startup hub vs member dashboard, milestones, applications, engagements, payouts, messenger. **No route middleware** — checked **inside controllers** and **frontend layout/nav**. |

They are **independent**. Example: `role: 'admin'`, `marketplace_role: 'startup'` → admin who also has a startup and sees startup hub when in startup mode.

---

## 2. Where `marketplace_role` Gets Its Value

### 2.1 User model (Backend)

**File:** `Backend/models/user.mode.ts`

- **Lines 32–33 (IUser):** `marketplace_role?: 'startup' | 'contributor' | null`
- **Lines 115–120 (schema):**  
  `marketplace_role: { type: String, default: 'contributor', enum: ['startup', 'contributor'], required: false }`

So in DB, if not set, it can be `undefined`; Mongoose default is `'contributor'` when the field is not provided on create. When reading, you can get `'startup'`, `'contributor'`, or `undefined`/`null`.

### 2.2 Registration (Backend)

**File:** `Backend/controllers/user.controller.ts`

- **Normal register** (e.g. `registrationUser`):  
  Body must include `marketplace_role` as `'startup'` or `'contributor'` (validation around 43–46). If `marketplace_role === 'startup'`, `startupName` is required (46). User is created with `role: 'user'` and the given `marketplace_role` (64–76).
- **Activation (activate-user / activate-link):**  
  Created user gets `role: 'user'` and `marketplace_role` from activation payload (e.g. 275–281, 365–371). Same for startup name/onboarding when startup.
- **Direct register:**  
  Can override both `role` and `marketplace_role` (e.g. 145–148, 183).

So every “normal” marketplace user is `role: 'user'`; only `marketplace_role` (and startup name) differ.

### 2.3 Login / session / me (Backend)

**File:** `Backend/controllers/user.controller.ts`

- Login, session-from-code, and get `/me` return the user object including **both** `role` and `marketplace_role` (e.g. 435–443, 524, 1040, 1075). Frontend and Redux store this for layout and guards.

### 2.4 Auth middleware (Backend)

**File:** `Backend/middleware/authWithRefresh.ts`

- Uses `UserModel.findById(decoded.id).select('-password ...')` and sets `req.user = user.toJSON()`. So **every authenticated request** has the full user document, including `role` and `marketplace_role`. No role or marketplace_role filtering in middleware.

---

## 3. Backend — Every Use of `marketplace_role` and `role` (Marketplace)

All marketplace routes use **only** auth (e.g. `updateAccessTokenMiddleware`, `isAuthenticated`). There is **no** route-level check for `marketplace_role`. Controllers decide behavior from `req.user`.

### 3.1 Milestone controller

**File:** `Backend/controllers/milestone.controller.ts`

| Function | Line(s) | Logic |
|----------|---------|--------|
| `listMilestones` | 39–68 | `role === 'admin'` → return milestones with status `Submitted` or `Paid`. `marketplace_role === 'startup'` → return milestones where `startupId === user._id`. `marketplace_role === 'contributor'` → return milestones where `assignedContributorId === user._id`. Otherwise → 403. |
| `createMilestone` | 72–92 | `user.marketplace_role !== 'startup'` → 403 "Only startups can create milestones". |
| `getMilestoneById` | 95–118 | Allowed if: startup owner, **or** admin, **or** (`marketplace_role === 'contributor'` **and** assigned to this milestone). Else 403. |
| `patchMilestone` | 121–197 | Assign: only startup owner when status is Open; assignee must be hired (Engagement). Transitions: `canTransition()` uses **role** for Paid/Rejected (admin only), **marketplace_role** for In Progress (startup), Completed (contributor + assigned). So: Open→In Progress = startup owner; In Progress→Completed = contributor and assigned; Completed→Submitted = startup owner; Submitted→Paid/Rejected = admin. |

**canTransition (20–34):**  
`role` is used only for `to === 'Paid' || to === 'Rejected'` (admin). All other transitions use `marketplaceRole`, `isStartupOwner`, `isAssignedContributor`.

### 3.2 Application controller

**File:** `Backend/controllers/application.controller.ts`

| Function | Line(s) | Logic |
|----------|---------|--------|
| `createApplication` | 10–76 | `user.marketplace_role !== 'contributor'` → 403 "Only contributors can apply to startups". Target user must have `marketplace_role === 'startup'` (27). |
| `patchApplication` | 78–117 | Allowed if startup owner **or** `user.role === 'admin'`. No marketplace_role check for PATCH. |
| `listMyApplications` | 119–139 | `marketplace_role === 'contributor'` → list applications where `contributorId === user._id`. `marketplace_role === 'startup'` → list applications where `startupId === user._id`. Else 403. |

### 3.3 Engagement controller

**File:** `Backend/controllers/engagement.controller.ts`

| Function | Line(s) | Logic |
|----------|---------|--------|
| `listEngagements` | 11–36 | `marketplace_role === 'startup'` → list engagements for that startup. `marketplace_role === 'contributor'` → list engagements for that contributor. Else 403. |
| `getEngagementById` | 38–68 | Startup can only access if `startupId === user._id`; contributor only if `contributorId === user._id`. Else 403. |
| `putEngagement` (create/update) | 64 | `user.marketplace_role !== 'startup'` → 403 "Only startups can manage engagements". |
| `getEngagementAnalytics` | 117–142 | `marketplace_role === 'startup'` → analytics for startup (paid to contributors, etc.). `marketplace_role === 'contributor'` → analytics for contributor (earned, pending, completed milestones). |

### 3.4 Startup profile controller

**File:** `Backend/controllers/startupProfile.controller.ts`

| Function | Line(s) | Logic |
|----------|---------|--------|
| GET own / PUT own | 16, 38 | `user.marketplace_role !== 'startup'` → 403 "Only startup users have/ can update startup profile". |
| GET /list/admin, PATCH status | 102, 171, 196 | Admin-only uses `user?.role === 'admin'`. |

### 3.5 Contributor profile controller

**File:** `Backend/controllers/contributorProfile.controller.ts`

| Function | Line(s) | Logic |
|----------|---------|--------|
| GET own / PUT own | 15, 39 | `user.marketplace_role !== 'contributor'` → 403 "Only contributor users have/ can update contributor profile". |

### 3.6 Contributor payout controller

**File:** `Backend/controllers/contributorPayout.controller.ts`

| Function | Line(s) | Logic |
|----------|---------|--------|
| `listContributorPayouts` | 11–32 | `marketplace_role === 'startup'` → list payouts sent by this startup. `marketplace_role === 'contributor'` → list payouts received by this contributor. Else 403. |
| `createContributorPayout` | 39 | `user.marketplace_role !== 'startup'` → 403 "Only startups can send payouts to contributors". |

### 3.7 Milestone payment controller

**File:** `Backend/controllers/milestonePayment.controller.ts`

| Function | Line(s) | Logic |
|----------|---------|--------|
| `listMilestonePayments` | 8–31 | `role === 'admin'` → all payments. `marketplace_role === 'startup'` → payments where `startupId === user._id`. Else 403. (Contributors do not list milestone payments here; they use engagement analytics / payouts.) |

### 3.8 User controller (onboarding)

**File:** `Backend/controllers/user.controller.ts`

| Function | Line(s) | Logic |
|----------|---------|--------|
| PUT /me/onboarding/startup | 593 | `user.marketplace_role !== 'startup'` → 403. |
| PUT /me/onboarding/contributor | 627 | `user.marketplace_role !== 'contributor'` → 403. |

### 3.9 Conversation controller (Messenger)

**File:** `Backend/controllers/conversation.controller.ts`

| Function | Line(s) | Logic |
|----------|---------|--------|
| `getOrCreateConversation` | 48–54 | Loads `marketplace_role` for both current user and other user. Messaging allowed **only** if one is `startup` and the other is `contributor`. So `roles` must include both 'startup' and 'contributor'. Else 403 "Messaging is only between marketplace startups and contributors". |

---

## 4. Frontend — Every Use of `marketplace_role` and `role` (Marketplace / Layout)

### 4.1 Auth state

- **AuthContext / Redux:** User object includes `marketplace_role` and `role` (e.g. `Frontend/src/contexts/AuthContext.tsx` 14–16, `authApi.ts` 88–91). Used by hooks and components.

### 4.2 Onboarding & startup redirect

**File:** `Frontend/src/lib/onboarding.ts`

| Function | Line(s) | Logic |
|----------|---------|--------|
| `getPostLoginPath` | 16–21 | If `marketplace_role === 'startup'` or legacy `startupName` → `/startup/dashboard`, else `/dashboard`. |
| `isStartupUser` | 24–28 | True if `marketplace_role === 'startup'` or `startupName` truthy. Used by useProtected, (startup) layout, Header, getPostLoginPath. |

**File:** `Frontend/src/hooks/useProtected.tsx`

- Uses `isStartupUser(user)` and `getStartupViewMode()`. If user is startup and view mode is "startup" and path is not under `/startup`, redirects to `/startup/dashboard`. If view mode is "normal", no redirect (startup sees main app). So **marketplace_role** (and legacy startupName) + view mode drive where startup users land.

**File:** `Frontend/src/app/onboarding/startup/page.tsx`

- 35, 73: Renders/redirects only if `user.marketplace_role === "startup"`. Non-startups get null/redirect.

### 4.3 Sidebar (nav items)

**File:** `Frontend/src/components/Sidebar/SidebarContent.tsx`

| Location | Logic |
|----------|--------|
| `getNavItems(..., marketplaceRole)` (40–47, 61–68, 301–311) | **marketplace_role === 'contributor'** adds under Marketplace: "My work", "My milestones", "My applications", "My contributor profile". **marketplace_role === 'startup' or 'contributor'** adds "Messenger" before Marketplace. |
| User label (337, 388–390) | **role** only: Instructor / Administrator / Influencer / Member. |
| Nav blocks (291–298) | **role** only: user vs instructor vs admin vs influencer items (admin gets Funding, Startup profiles, etc.). |

So: **role** = which main nav blocks (Dashboard, Education, Admin, etc.). **marketplace_role** = contributor-only marketplace children + Messenger for both startup and contributor.

### 4.4 Marketplace pages (UI branching)

Each page typically reads `(user as { marketplace_role?: string })?.marketplace_role` and shows different content:

| Page | File | Use of marketplace_role |
|------|------|--------------------------|
| My work | `marketplace/work/page.tsx` | `marketplaceRole` → contributor sees engagements/payouts; non-contributor sees message/link. |
| My milestones | `marketplace/milestones/page.tsx` | `isContributor` → contributor sees assigned milestones + "Mark complete"; non-contributor sees "For contributors only" style message. |
| My applications | `marketplace/my-applications/page.tsx` | `marketplaceRole` → contributor sees applications; else empty state. |
| Contributor profile | `marketplace/contributor-profile/page.tsx` | `marketplaceRole` → contributor sees/edit profile; else message. |
| Startups list | `marketplace/startups/page.tsx` | No direct marketplace_role check (browse is public for logged-in). |
| Startups [id] | `marketplace/startups/[id]/page.tsx` | `marketplaceRole` → show "Apply" for contributors. |
| Contributors list / [id] | `marketplace/contributors/page.tsx`, `contributors/[id]/page.tsx` | `marketplaceRole` used for context (e.g. apply flow). |

### 4.5 Registration form

**File:** `Frontend/src/app/(registration)/registration-form/page.tsx`

- Schema requires `marketplace_role: z.enum(["startup", "contributor"])` (19). If startup, `startupName` required (31). Submitted to backend with `marketplace_role` and optional `startupName` (88, 99).

### 4.6 Startup layout and view mode

**File:** `Frontend/src/app/(startup)/layout.tsx`

- Renders only when `isStartupUser(user)` (marketplace_role === 'startup' or startupName). Otherwise redirect to `/dashboard`. "View as member" sets view mode to "normal" and navigates to `/dashboard`.

**File:** `Frontend/src/components/Header/Header.tsx`

- "Startup mode" button visible only when user is startup and view mode is "normal"; switches back to startup hub.

---

## 5. Data Flow Summary

1. **Registration** → User created with `role: 'user'` and `marketplace_role: 'startup' | 'contributor'` (from body or activation).
2. **Login / me** → Frontend receives `role` and `marketplace_role`; stored in Redux/AuthContext.
3. **Backend requests** → Auth middleware sets `req.user` from DB (full user, including both fields). No route middleware checks marketplace_role.
4. **Backend controllers** → Each marketplace controller checks `req.user.role` and/or `req.user.marketplace_role` to decide: who can list what, who can create/update, and what data to return.
5. **Frontend layout** → `isStartupUser(user)` (marketplace_role or startupName) + view mode → redirect to `/startup/dashboard` or show main app.
6. **Frontend nav** → `user.role` → which blocks (admin, instructor, etc.); `user.marketplace_role` → contributor-only marketplace links + Messenger.
7. **Frontend pages** → `marketplace_role === 'contributor'` (or not) → show contributor-specific content or empty state.

---

## 6. "Who Can Do What?" Quick Lookup (Marketplace)

| Action | Who can do it | Check used |
|--------|----------------|------------|
| Create milestone | Startup only | `marketplace_role === 'startup'` |
| List own milestones (startup) | Startup | `marketplace_role === 'startup'` |
| List submitted/paid milestones | Admin | `role === 'admin'` |
| List assigned milestones | Contributor | `marketplace_role === 'contributor'` |
| Assign milestone + In Progress | Startup owner | ownership + `marketplace_role` in canTransition |
| Mark milestone Completed | Assigned contributor | `marketplace_role === 'contributor'` + assigned |
| Submit for funding | Startup owner | isStartupOwner in canTransition |
| Approve (Paid) / Reject milestone | Admin | `role === 'admin'` |
| Create application to startup | Contributor only | `marketplace_role === 'contributor'` |
| List my applications | Contributor or startup | `marketplace_role === 'contributor'|'startup'` |
| Accept/reject application | Startup owner or admin | ownership or `role === 'admin'` |
| Create/update engagement | Startup only | `marketplace_role === 'startup'` |
| List engagements | Startup or contributor | `marketplace_role === 'startup'|'contributor'` |
| GET/PUT startup profile | Startup only | `marketplace_role === 'startup'` |
| GET/PUT contributor profile | Contributor only | `marketplace_role === 'contributor'` |
| List payouts (sent) | Startup | `marketplace_role === 'startup'` |
| List payouts (received) | Contributor | `marketplace_role === 'contributor'` |
| Create payout | Startup only | `marketplace_role === 'startup'` |
| List milestone payments (admin) | Admin | `role === 'admin'` |
| List milestone payments (funding received) | Startup | `marketplace_role === 'startup'` |
| Start conversation (messenger) | One startup + one contributor | Both users' marketplace_roles must include startup and contributor |

---

## 7. Edge Cases & Troubleshooting

- **marketplace_role null/undefined:** Schema default is `'contributor'` on create; if never set, DB may have undefined. Frontend treats non-contributor as "no contributor links"; backend returns 403 for contributor/startup-only actions.
- **Admin who is also startup:** Can use startup hub (view mode) and still access admin routes (Funding, Startup profiles) because **role** is checked for admin, **marketplace_role** for startup.
- **User has no marketplace_role:** Can browse Startups/Contributors; cannot see My work, My milestones, My applications, Contributor profile; cannot create applications or use startup-only APIs.
- **"I'm startup but see main dashboard"** → Check view mode (localStorage `equalmint_startup_view_mode`). If "normal", use "Startup mode" in header to go back.
- **"I'm contributor but no My milestones"** → Check `/me` and Redux: `marketplace_role` must be `'contributor'`. Backend list milestones for contributor only when `marketplace_role === 'contributor'`.

---

## 8. File Reference (Marketplace Roles)

**Backend:**  
`user.mode.ts`, `user.controller.ts` (register, login, activation, onboarding), `milestone.controller.ts`, `application.controller.ts`, `engagement.controller.ts`, `startupProfile.controller.ts`, `contributorProfile.controller.ts`, `contributorPayout.controller.ts`, `milestonePayment.controller.ts`, `conversation.controller.ts`.  
**Frontend:**  
`AuthContext.tsx`, `authApi.ts`, `onboarding.ts`, `startupViewMode.ts`, `useProtected.tsx`, `SidebarContent.tsx`, `Header.tsx`, `(startup)/layout.tsx`, `(registration)/registration-form/page.tsx`, and all marketplace pages under `(userdashboard)/marketplace/`.

Use this doc together with `ROLES_AND_MARKETPLACE_DEEP_ANALYSIS.md` for a full picture of **role** (platform) and **marketplace_role** (marketplace identity) across the app.
