# Roles & Marketplace Roles — Deep Analysis

This document is a **single reference** for how **role** and **marketplace_role** work across the whole app: where they come from, how they're enforced in backend and frontend, and how they interact. Use it to debug access issues, add features, or onboard.

**For line-by-line and controller-level detail on marketplace roles**, see **`MARKETPLACE_ROLES_DEEP_DIVE.md`** (every backend/frontend usage, data flow, and "who can do what" table).

---

## 1. Two Separate Systems

| System | Field | Values | Purpose |
|--------|--------|--------|--------|
| **Platform role** | `role` | `user`, `instructor`, `admin`, `influencer` | Course/education, admin panel, analytics, governance. |
| **Marketplace role** | `marketplace_role` | `startup`, `contributor` (or `null`) | Startup hub vs member dashboard, marketplace APIs (milestones, applications, payouts, etc.). |

They are **independent**:

- A user can have `role: 'user'` and `marketplace_role: 'startup'` (typical startup account).
- A user can have `role: 'admin'` and `marketplace_role: 'contributor'` (admin who also uses marketplace as contributor).
- **Platform role** is checked by backend middleware (`requireAdmin`, `requireRole`) and frontend `RoleProtected` / `useRole`.
- **Marketplace role** is **not** in route middleware; it’s checked **inside** marketplace controllers and in the frontend layout/redirect logic.

---

## 2. Where Values Come From

### 2.1 User model (Backend)

**File:** `Backend/models/user.mode.ts`

- **role**
  - `enum: ['user', 'instructor', 'admin', 'influencer']`
  - `default: 'user'`
  - Set at registration to `'user'`; changed to `instructor`/`admin`/`influencer` via admin or apply-instructor flow.

- **marketplace_role**
  - `enum: ['startup', 'contributor']`
  - `default: 'contributor'` (in schema)
  - Set at **registration** from request body (`marketplace_role`, required when registering for marketplace).
  - Optional: direct-register and activation flows can set it from payload.

So:

- **role** = platform permission (user / instructor / admin / influencer).
- **marketplace_role** = “am I a startup or a contributor (or neither)?” for marketplace features.

### 2.2 Registration (Backend)

**File:** `Backend/controllers/user.controller.ts`

- **Normal register** (`registrationUser`): body can include `marketplace_role` and (for startup) `startupName` / `startupDescription`. User is created with `role: 'user'` and, if provided, `marketplace_role: 'startup' | 'contributor'`.
- **Activation (activate-user / activate-link)**: created user gets `role: 'user'` and, from the activation payload, `marketplace_role` and optionally `startupName` / `startupOnboardingComplete` / `contributorOnboardingComplete`.
- **Direct register** (`directRegisterUser`): can override `role` and `marketplace_role` (e.g. for seeding admins or test users).

Result: every “normal” marketplace user is still `role: 'user'`; only `marketplace_role` and optional `startupName` differ.

### 2.3 Login response (Backend)

**File:** `Backend/controllers/user.controller.ts` (login, session-from-code, get /me)

- Response user object includes both `role` and `marketplace_role` (and onboarding flags). Frontend and Redux store this and use it for layout and guards.

---

## 3. Backend — Where `role` Is Used

### 3.1 Route-level middleware (role only)

**File:** `Backend/middleware/roleAuth.ts`

- `requireRole(roles)` — allows request only if `req.user.role` is in `roles`.
- `requireAdmin` = `requireRole(['admin'])`
- `requireInstructorOrAdmin` = `requireRole(['instructor', 'admin'])`
- `requireInfluencerOrAdmin` = `requireRole(['influencer', 'admin'])`
- `requireAuth` = `requireRole(['user', 'instructor', 'admin', 'influencer'])`

**Used in routes:**

- **Admin-only:**  
  `admin.route`, `role.route` (users, role update, delete), `review.route` (admin all/delete), `enrollment.route` (orders), `course.route` (admin all/status/delete), `bulkUser.route`, `governance/proposal.route` (status/delete).
- **Instructor or admin:**  
  `course.route` (instructor my-courses, update, delete).
- **Influencer or admin:**  
  `influencer.route` (analytics).
- **Governance:**  
  `proposal.route`: `requireRole('admin')` for PATCH status and DELETE.

So: **platform features** (courses, orders, reviews, admin, governance, influencer) are gated by **role**, not by `marketplace_role`.

### 3.2 Inside controllers (role)

- **Milestone:**  
  Only `role === 'admin'` can transition to `Paid` or `Rejected`; startup/contributor logic uses `marketplace_role`.
- **Startup profile:**  
  `GET /list` (public) vs `GET /list/admin` and `PATCH /:id` (status) require `user.role === 'admin'`.
- **Application:**  
  `PATCH` (accept/reject) allowed for startup owner **or** `user.role === 'admin'`.
- **Milestone payment:**  
  Admin sees all, startup sees own (admin check is `role === 'admin'`).
- **Auth utils:**  
  `authorizeSeller`: allows `role === 'admin'` or `isSeller === true`.

Summary: **role** is the only field used for “admin” or “instructor” or “influencer” access in the backend; **marketplace_role is never used in route middleware**, only in controller logic for marketplace resources.

---

## 4. Backend — Where `marketplace_role` Is Used

All marketplace routes use **only** auth middleware (`updateAccessTokenMiddleware`, `isAuthenticated`). There is **no** route-level check for `marketplace_role`. Controllers decide behavior from `req.user` (including `marketplace_role`).

### 4.1 Startup-only (marketplace_role === 'startup')

- **Startup profile:**  
  GET/PUT own profile; only startup users have a startup profile.
- **Milestone:**  
  Create milestone; list own milestones; PATCH to assign + In Progress, or to Submitted; GET own.
- **Application:**  
  List applications “to me”; PATCH accept/reject (or admin).
- **Engagement:**  
  List/create/update engagements; analytics (paid to contributors).
- **Contributor payout:**  
  List payouts sent; create payout (startup only).
- **Onboarding:**  
  `PUT /me/onboarding/startup` only if `marketplace_role === 'startup'`.

### 4.2 Contributor-only (marketplace_role === 'contributor')

- **Contributor profile:**  
  GET/PUT own contributor profile.
- **Application:**  
  POST create application (contributor only); list “my” applications.
- **Milestone:**  
  List milestones where `assignedContributorId === me`; PATCH to Completed only for those.
- **Engagement:**  
  List my engagements; GET own; analytics (earned, received, pending).
- **Contributor payout:**  
  List payouts received.
- **Onboarding:**  
  `PUT /me/onboarding/contributor` only if `marketplace_role === 'contributor'`.

### 4.3 Admin (role === 'admin') in marketplace

- **Startup profile:**  
  GET /list/admin; PATCH /:id status (approve/reject).
- **Milestone:**  
  List Submitted + Paid; PATCH to Paid or Rejected.
- **Milestone payment:**  
  List all.
- **Application:**  
  PATCH accept/reject (same as startup owner).

So: **marketplace_role** drives “who can do what” in marketplace controllers; **role === 'admin'** adds extra capabilities (e.g. approve startups, pay milestones) on top.

---

## 5. Frontend — Where `role` Is Used

### 5.1 Auth and role source

- **AuthContext / Redux:**  
  User object includes `role` and `marketplace_role`. Used by hooks and components.
- **useRole (Redux):**  
  `user.role` only. Exposes `hasRole`, `isAdmin`, `isInstructor`, `isUser`, `isInfluencer`, `requireAdmin`, etc.
- **RoleProtected:**  
  Uses `user.role` only. `allowedRoles` is an array of **platform** roles (`admin`, `instructor`, `user`, `influencer`).
  - **AdminProtected** = `allowedRoles={['admin']}`
  - **InstructorProtected** = `['instructor']`
  - **UserProtected** = `['user']`
  - **AllRolesProtected** = `['user', 'instructor', 'admin', 'influencer']`
  - **InfluencerProtected** = `['influencer', 'admin']`

So: every **role-based** guard or redirect on the frontend is based on **role**, not `marketplace_role`.

### 5.2 Sidebar and nav (role + marketplace_role)

**File:** `Frontend/src/components/Sidebar/SidebarContent.tsx`

- **Platform role** (`userRole = user?.role || 'user'`):
  - Drives which **blocks** of nav items are shown: user items, instructor items, admin items, influencer items.
  - Admin gets Dashboard, Education, Governance, Messenger (if marketplace), Marketplace, **Admin** (Funding, Startup profiles, Education Management, Governance, Analytics), Settings, Profile.
  - Instructor gets instructor-specific items; user gets user items; influencer gets influencer items.

- **Marketplace role** (`marketplaceRole = user?.marketplace_role`):
  - **Contributor:**  
    Extra Marketplace children: “My work”, “My milestones”, “My applications”, “My contributor profile”.
  - **Startup:**  
    No extra sidebar items here — startup users are normally in the **(startup)** layout and never see this sidebar (they’re redirected to `/startup/dashboard` unless view mode is “normal”).
  - **Messenger:**  
    Messenger link is added for `marketplace_role === 'contributor' || marketplace_role === 'startup'`.

So: **role** = which main nav sections you get; **marketplace_role** = whether you get contributor-specific marketplace links (and messenger). Startup-specific UI is in the startup layout, not in this sidebar.

---

## 6. Frontend — Where `marketplace_role` and Startup Layout Are Used

### 6.1 useProtected and startup redirect

**File:** `Frontend/src/hooks/useProtected.tsx`

- Wraps the **(userdashboard)** layout (main app).
- If user is **startup** (`isStartupUser(user)`) and **view mode** is **startup** (not “normal”):
  - Any path **not** under `/startup` is redirected to `/startup/dashboard`.
  - Renders a spinner until redirect (so startup users don’t see main dashboard content when in “startup” mode).
- If startup user has **view mode “normal”** (localStorage `equalmint_startup_view_mode === 'normal'`):
  - No redirect; they see the main app like any other user. “Startup mode” in the header sends them back to `/startup/dashboard` and flips view mode back to “startup”.

So: **marketplace_role === 'startup'** (or legacy `startupName`) plus view mode drives whether you see the main app or the startup hub.

### 6.2 isStartupUser

**File:** `Frontend/src/lib/onboarding.ts`

- `isStartupUser(user)` = `user.marketplace_role === 'startup'` or `(user as any).startupName` truthy.
- Used in:
  - **useProtected** (redirect to startup hub when view mode is startup).
  - **(startup) layout** (only render startup layout if `isStartupUser(user)`; else redirect to `/dashboard`).
  - **Header** (show “Startup mode” when startup and view mode is normal).
  - **getPostLoginPath** (startup → `/startup/dashboard`, others → `/dashboard`).

So: **marketplace_role** (and legacy startupName) alone decide “is this a startup account?” for layout and redirects; **role** is not used there.

### 6.3 (startup) layout

**File:** `Frontend/src/app/(startup)/layout.tsx`

- Renders **only** when `isStartupUser(user)` (and not loading).
- Otherwise redirects to `/dashboard` (so non-startup users can’t open `/startup/*` and see the startup UI).
- Header has “View as member” → sets view mode to “normal” and navigates to `/dashboard`.

So: **marketplace_role === 'startup'** (or startupName) is what gives you the startup hub; **role** is irrelevant for that layout.

### 6.4 Pages that check marketplace_role

- **Marketplace pages (contributor):**  
  My work, My milestones, My applications, Contributor profile, Startups [id] (Apply button), etc. They often do `marketplace_role === 'contributor'` to show contributor-only content or empty state for non-contributors.
- **Marketplace milestones:**  
  Contributor sees “My milestones” (assigned); non-contributor sees “For contributors only” style message.
- **Admin pages:**  
  Use **role** via `AdminProtected` (e.g. Funding, Startup profiles). No `marketplace_role` check for admin access.

So: **marketplace_role** is used for “show contributor/startup-specific UI” and for layout; **role** is used for “show admin/instructor UI” and route protection.

---

## 7. Combined Role + Marketplace Matrix (Simplified)

| Who | role | marketplace_role | Where they land (default) | What they can do (high level) |
|-----|------|-------------------|----------------------------|--------------------------------|
| Normal member | user | contributor or null | /dashboard | Education, Governance, Marketplace (browse + if contributor: my work, my milestones, my applications, contributor profile). |
| Startup | user | startup | /startup/dashboard | Startup hub (profile, milestones, hiring, team, funding, messenger). Can switch to “View as member” to see main app. |
| Instructor | instructor | any | /dashboard | Same as user + instructor courses, analytics, students, earnings. |
| Admin | admin | any | /dashboard | Everything: admin panel (users, orders, courses, reviews, governance), **plus** marketplace admin (Funding, Startup profiles). Can still be startup or contributor. |
| Influencer | influencer | any | /dashboard | Influencer analytics; can be contributor/startup as well. |

Important: **Admin and influencer are defined only by `role`.** Their `marketplace_role` (if set) only affects whether they get contributor/startup nav and APIs; it does not change admin or influencer permissions.

---

## 8. Where Things Can Go Wrong (and how to check)

1. **“I’m a startup but I see the main dashboard”**  
   - Check view mode: localStorage `equalmint_startup_view_mode` should be `startup` for startup hub. If it’s `normal`, you’re intentionally in “member” view; use “Startup mode” in the header to go back.
   - Check `user.marketplace_role` and `user.startupName` in /me and Redux; if both missing, `isStartupUser` is false.

2. **“I’m a contributor but I don’t see My milestones / My work”**  
   - Sidebar shows those only when `marketplace_role === 'contributor'`. Check /me and Redux for `marketplace_role`. If it’s null or `startup`, backend and frontend will treat you as non-contributor for those features.

3. **“Admin can’t approve startup or pay milestone”**  
   - Backend requires `user.role === 'admin'` for those actions. Confirm login/me returns `role: 'admin'`. Frontend uses `AdminProtected` (role only); if you see the page but API returns 403, backend is not seeing admin role (e.g. cookie/token for different user).

4. **“I get 403 on marketplace API”**  
   - Marketplace routes only require auth; controller checks `marketplace_role` and ownership. Check: (a) correct cookie/session, (b) `marketplace_role` and resource ownership (e.g. startupId, contributorId) match what the controller expects.

5. **“RoleProtected says Access Denied for admin page”**  
   - RoleProtected uses **role** only. Ensure `user.role === 'admin'` in Redux/AuthContext. If you’re an admin but also startup, your **role** must still be `admin` to pass.

---

## 9. File Reference (roles and marketplace_role)

**Backend**

- User model: `Backend/models/user.mode.ts` (role, marketplace_role enums and defaults).
- Auth: `Backend/utils/auth.ts` (isAuthenticated, authorizeRoles, authorizeSeller); `Backend/middleware/authWithRefresh.ts` (sets req.user from DB).
- Role middleware: `Backend/middleware/roleAuth.ts` (requireAdmin, requireRole, etc.).
- User controller: `Backend/controllers/user.controller.ts` (register, login, activation, onboarding, /me — sets/returns role and marketplace_role).
- Marketplace controllers:  
  `milestone.controller.ts`, `application.controller.ts`, `engagement.controller.ts`, `contributorPayout.controller.ts`, `milestonePayment.controller.ts`, `startupProfile.controller.ts`, `contributorProfile.controller.ts` (all use `req.user.role` and/or `req.user.marketplace_role` inside).

**Frontend**

- Auth/role state: `Frontend/src/contexts/AuthContext.tsx`, Redux auth slice, `Frontend/src/hooks/useRole.tsx` (role only).
- Guards: `Frontend/src/components/RoleProtected.tsx` (role only); `Frontend/src/hooks/useProtected.tsx` (startup redirect + view mode).
- Onboarding/startup: `Frontend/src/lib/onboarding.ts` (isStartupUser, getPostLoginPath); `Frontend/src/lib/startupViewMode.ts` (view as member vs startup).
- Layouts: `Frontend/src/app/(userdashboard)/layout.tsx` (Protected wrapper), `Frontend/src/app/(startup)/layout.tsx` (isStartupUser, “View as member”).
- Nav: `Frontend/src/components/Sidebar/SidebarContent.tsx` (role + marketplace_role for items); `Frontend/src/components/Header/Header.tsx` (startup view mode + “Startup mode” button).
- Pages: Admin pages use `AdminProtected`; marketplace pages often check `marketplace_role === 'contributor'` or show different content by role.

---

## 10. Summary Table

| Concept | Backend | Frontend |
|--------|---------|----------|
| **role** | Set at register (user); changed by admin or apply-instructor. Middleware: requireAdmin, requireRole. Controllers: admin/instructor/influencer actions. | From /me and Redux. useRole, RoleProtected, Sidebar (which nav blocks). |
| **marketplace_role** | Set at register/activation/direct. No route middleware; only controller logic for startup vs contributor and resource ownership. | From /me and Redux. useProtected redirect, (startup) layout, Sidebar (contributor links, messenger), marketplace pages (who sees what). |
| **Startup view mode** | N/A | localStorage; useProtected and Header use it so startup can see main app (“normal”) or startup hub (“startup”). |

Use this doc when you need to trace “why can this user (or can’t they) do X?” — and whether the answer lives in **role**, **marketplace_role**, or **view mode**.
