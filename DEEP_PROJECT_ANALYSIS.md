# Deep Project Analysis — Equalmint (0xmintyn)

This document is a **single source of truth** for understanding the whole project. Use it when you feel stuck or when onboarding.

**Last deep analysis:** Full API map, frontend routes, data flows, gaps (video route, exchange page, governance fields), and security/ops notes.

**For an even deeper dive and “how to add new things”:** See **`DEEP_ANALYSIS_FULL.md`** — backend middleware chain, auth (cookies-only), every route group, models, frontend provider tree, RTK vs axios, and step-by-step guides for adding a new API, new page, new role, or new model/CRUD.

---

## 0. Removed: Startup & Contributor (Static Features)

**Startup and contributor features have been removed completely.**

- **Removed from Frontend:**  
  - All routes: `/startups`, `/startups/[id]`, `/startup/*` (dashboard, apply, applications, profile, settings, jobs, hire), `/contributors`, `/contributors/[id]`, `/contributor/*` (dashboard, apply, applications, profile, settings).  
  - All components: `Startup/StartupApplicationModal`, `Startup/CreateJobPostingModal`, `Startup/HireContributorModal`, `Contributor/ContributorApplicationModal`.  
  - Sidebar: "Startups" and "Contributors" menu blocks and their submenus; contributor/startup role-specific nav items.  
  - Dashboard: "Become Contributor" and "Apply as Startup" buttons.  
- **RoleBasedDashboard:** Users with role `contributor` or `startup` now see the same unified dashboard as `user`/`instructor` (no redirect to removed pages).  
- **Backend:** No startup/contributor routes or controllers existed; nothing removed there.

If you need to restore any of this, use version control; the code was fully removed.

---

## 1. What This Project Is

- **Name:** Equalmint (0xmintyn)
- **Type:** Full‑stack web app — learning platform + UBI/governance + roles (user, instructor, admin, influencer). **Startup and contributor roles/pages are removed; those users see the unified dashboard.**
- **Frontend:** Next.js 15 (App Router), React 19, Redux + RTK Query, Tailwind, Radix UI.
- **Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose), JWT + Auth0, Socket.IO, Cloudinary, Nodemailer.

**Main flows:**  
Register → email OTP → verify → login → dashboard. Plus: courses, enrollments, bookmarks, certificates, governance (proposals/votes), admin, instructor/influencer dashboards, settings.

---

## 2. Project Layout (Where Things Live)

### 2.1 Frontend (`Frontend/`)

```
Frontend/
├── src/
│   ├── app/                    # Next.js App Router (routes = folders)
│   │   ├── layout.tsx          # Root layout (theme, providers, SessionProvider)
│   │   ├── page.tsx            # Landing /
│   │   ├── Provider.tsx        # Redux + AuthProvider + AutoLogoutProvider
│   │   ├── (login)/            # Login, forgot-password, reset-password
│   │   ├── (registration)/     # registration-form
│   │   ├── (verification)/     # verification (OTP), activation-link
│   │   ├── auth0-success/      # Auth0 callback
│   │   └── (userdashboard)/    # All logged-in pages
│   │       ├── layout.tsx      # ThemeProvider, Protected, SidebarProvider, LayoutContent
│   │       ├── LayoutContent.client.tsx  # Sidebar + Header + main
│   │       ├── dashboard/
│   │       ├── settings/
│   │       ├── myprofile/
│   │       ├── educationhub/
│   │       ├── governance/
│   │       ├── instructor/...
│   │       ├── admin/...
│   │       ├── influencer/
│   │       ├── exchange/
│   │       └── ...
│   ├── components/             # Reusable UI + feature components
│   ├── contexts/               # AuthContext, Theme, FontSize, TextToSpeech, Sidebar
│   ├── hooks/                  # useAuth, useProtected, useRole, useToast, etc.
│   ├── redux/
│   │   ├── store.ts            # Redux store + auth init from localStorage
│   │   └── features/
│   │       ├── api/apiSlice.ts # RTK Query base + loadUser, refreshToken
│   │       ├── auth/authSlice.ts, authApi.ts
│   │       ├── user/userApi.ts
│   │       └── ...
│   ├── lib/                    # types, utils, formatters, api, uploadFileToBackend
│   ├── utils/                  # axiosInstance, tokenRefresh, ubiContract, treasuryManager
│   └── services/               # enrollmentService, roleService
├── .env / .env.local           # NEXT_PUBLIC_SERVER_URI (must point to backend /api/v1)
└── package.json
```

**Important:** All API calls use `process.env.NEXT_PUBLIC_SERVER_URI` (e.g. `https://api.equalmint.com/api/v1/`). No trailing slash issues if you use it as base and append paths like `me`, `login`, etc.

### 2.2 Backend (`Backend/`)

```
Backend/
├── app.ts              # Express app: CORS, body parser, routes, 404, error middleware
├── server.ts            # HTTP server + Socket.IO, DB connect, PORT/HOST from env
├── socketServer.ts      # Socket.IO setup
├── config/             # auth0.config.ts
├── controllers/         # user, course, enrollment, auth0, governance, admin, etc.
├── middleware/          # error, auth, basicAuth, multer, catchAsyncError, etc.
├── models/              # user.mode.ts (typo: "mode"), course, order, review, governance...
├── routes/              # Mounted under /api/v1 (see app.ts)
├── utils/               # db, jwt, auth, logger, sendMail, errorHandler
├── mails/               # activatiomail.ejs, resetPassword.ejs
├── services/            # user.services.ts
└── .env                 # PORT, DB_URI, JWT secrets, SMTP, Auth0, DIRECT_REGISTER_*, etc.
```

**Route mounting in app.ts:**  
- `userRouter` → `/api/v1` (so `/api/v1/register`, `/api/v1/login`, `/api/v1/me`, `/api/v1/register-direct`, etc.)  
- Others: `/api/v1/upload`, `/api/v1/stream`, `/api/v1/course`, `/api/v1/analytics`, `/api/v1/role`, `/api/v1/enrollment`, `/api/v1/certificate`, `/api/v1/bookmark`, `/api/v1/review`, `/api/v1/note`, `/api/v1/instructor`, `/api/v1/admin`, `/api/v1/dashboard`, `/api/v1/influencer`, `/api/v1/proposal`, `/api/v1/vote`, `/api/v1/auth0`, `/api/v1/health`.  
- **Note:** `video.route.ts` exists (signed-url, stream, course videos) but is **not mounted** in `app.ts`; video streaming may use `/api/v1/stream` (static file) or course endpoints. See Section 14.

### 2.3 Full API Route Reference (Backend)

| Base path | Method | Endpoint (relative to base) | Auth | Purpose |
|-----------|--------|-----------------------------|------|---------|
| `/api/v1` | POST | `/register` | No | Register + send OTP email |
| `/api/v1` | POST | `/register-direct` | Basic Auth | Direct user creation (no OTP) |
| `/api/v1` | POST | `/activate-user` | No | Activate with OTP code |
| `/api/v1` | POST | `/activate-link` | No | Activate via link token |
| `/api/v1` | POST | `/login` | No | Login email/password |
| `/api/v1` | GET | `/refreshtoken` | Cookie/body | Refresh access token |
| `/api/v1` | GET | `/me` | Yes | Current user |
| `/api/v1` | POST | `/forgot-password`, `/reset-password` | No | Password reset flow |
| `/api/v1` | GET/PUT | `/users`, `/update-user-info`, `/update-username`, etc. | Yes | User CRUD, avatar, banner, instructor apply |
| `/api/v1/health` | GET | `/health`, `/health/detailed`, `/health/crash-report` | No | Health checks |
| `/api/v1/upload` | POST | (multiple) | Yes | Avatar, banner, course thumbnails, videos (multer/Cloudinary) |
| `/api/v1/stream` | GET | `/:filename` | No | Static video file streaming from `uploads/videos` |
| `/api/v1/course` | GET/POST/PUT/DELETE | `/`, `/:id`, `/instructor/my-courses`, `/admin/all`, etc. | Mixed | Courses CRUD, admin |
| `/api/v1/enrollment` | POST/GET | `/enroll/:courseId`, `/my-courses`, `/progress/...`, `/orders` | Yes | Enroll, progress, orders |
| `/api/v1/certificate` | GET | `/generate/:courseId`, `/eligibility/:courseId` | Yes | Certificates |
| `/api/v1/bookmark` | POST/DELETE/GET | `/add`, `/remove/:courseId`, `/my-bookmarks`, `/count` | Yes | Bookmarks |
| `/api/v1/review` | GET/POST/PUT/DELETE | `/course/:courseId`, `/create`, `/:reviewId`, `/admin/*` | Yes | Reviews |
| `/api/v1/note` | GET/POST/DELETE | `/course/:courseId`, `/save` | Yes | Notes |
| `/api/v1/role` | GET/PUT/DELETE | `/dashboard`, `/users`, `/users/:userId/role` | Yes | Role dashboard, admin user/role |
| `/api/v1` (instructor) | GET | `/instructor-stats/:id`, `/instructor/dashboard`, `/instructor/analytics`, etc. | Yes | Instructor stats & dashboard |
| `/api/v1/admin` | GET | `/users`, `/orders` | Admin | Admin users/orders |
| `/api/v1/dashboard` | GET | `/totalusers`, `/totalinstructors`, `/totalcourses`, `/avgrating`, etc. | Yes | Dashboard stats |
| `/api/v1/influencer` | GET | `/analytics` | Influencer/Admin | Influencer analytics |
| `/api/v1/proposal` | GET/POST/PATCH/DELETE | `/stats`, `/top`, `/all`, `/:proposalId`, `/create`, `/user/:userId` | Mixed | Governance proposals |
| `/api/v1/vote` | POST/PUT/DELETE/GET | `/:proposalId`, `/:proposalId/stats`, `/user/:userId` | Yes | Governance votes |
| `/api/v1` (auth0) | GET/POST | `/auth0/login`, `/auth/callback`, `/auth0/link`, `/auth0/unlink` | Mixed | Auth0 login & link |

---

## 3. Authentication & Authorization (Deep Dive)

### 3.1 Two Ways to Log In

1. **Email + password (your API)**  
   - Register → email OTP → verify (activation) → user created with `isVerified: true` → login with email/password.  
   - JWT: access token (short-lived) + refresh token (cookie or body).  
   - Frontend: Redux `authSlice` + `authApi` (login, register, activation), tokens/user in localStorage; `apiSlice` and `axiosInstance` do refresh on 401.

2. **Auth0 (social/login)**  
   - Auth0 login → callback to `/auth0-success` → backend creates/updates user and issues JWT → frontend stores user/token and redirects to dashboard.

### 3.2 How Auth State Flows (Frontend)

- **Redux:** `authSlice` holds `user`, `accessToken`, `isAuthenticated`.  
- **Persistence:** On load, `store.ts` reads `user` and `accessToken` from localStorage and dispatches `userLoggedIn` so the app has a user before the first API call.  
- **AuthContext:** Wraps app, uses `useLoadUserQuery` (RTK) and Redux selectors; exposes `user`, `isAuthenticated`, `isLoading`, `logout`, `refetchUser`. So components use `useAuth()` from AuthContext, which is backed by Redux + `/me`.  
- **Protected routes:** `useProtected` (or a Protected component) checks `useAuth()` and redirects to login if not authenticated.  
- **Role-based UI:** `useRole()` (or similar) derives role from the same user; dashboards (instructor, admin, influencer) show per role.

### 3.3 Backend Auth

- **JWT:** Access token in body/header; refresh token in cookie or body.  
- **Middleware:** `isAuthenticated` (or authWithRefresh) verifies JWT and attaches user.  
- **Role checks:** Admin/instructor routes use role middleware or checks in controllers.

---

## 4. Critical Flows (Step by Step)

### 4.1 Registration (with OTP)

1. **Frontend:** `(registration)/registration-form/page.tsx` → form with firstName, lastName, email, username, password, contactNumber, nationality, dateOfBirth (all required for backend).  
2. **API:** `POST /api/v1/register` with that body.  
3. **Backend:** `user.controller.ts` → `registrationUser`: checks email/username unique, builds JWT with user payload + 4‑digit OTP, sends email (activatiomail.ejs) with OTP and activation link, returns `activationToken` (JWT).  
4. **Frontend:** Stores `activationToken` in Redux + localStorage, redirects to `/verification`.  
5. **User:** Enters 4‑digit OTP from email.  
6. **Frontend:** `(verification)/verification/page.tsx` → `POST /api/v1/activate-user` with `activation_token` + `activation_code` (OTP).  
7. **Backend:** Verifies JWT and OTP, creates user with `UserModel.create(newUser.user)` (password hashed by user model pre‑save).  
8. **Frontend:** Redirect to `/login`. User then logs in with email/password.

### 4.2 Direct Registration (Secret API, No OTP)

- **API:** `POST /api/v1/register-direct` with Basic Auth (`DIRECT_REGISTER_AUTH_USER`, `DIRECT_REGISTER_AUTH_PASSWORD`) and same body as above (optional `role`).  
- **Backend:** `basicAuthDirectRegister` middleware → `directRegisterUser` controller: creates user with `isVerified: true`.  
- **Use case:** Scripts/loops to create many users without email. Keep credentials secret.

### 4.3 Login

- **Frontend:** `(login)/login/page.tsx` → `authApi.login({ email, password })`.  
- **Backend:** `POST /api/v1/login` → validates credentials, returns access token (and sets refresh token cookie if configured).  
- **Frontend:** Redux `userLoggedIn` + localStorage; redirect to `/dashboard`.

### 4.4 Keeping the User Logged In

- **Initial load:** Redux hydrates from localStorage; then `loadUser` (GET `/me`) runs. If cookies/JWT are valid, backend returns user + token; Redux and AuthContext update.  
- **401 on any request:** `apiSlice` base query (or axios interceptor) calls GET `/refreshtoken` and retries. If refresh fails, clear storage and redirect to login.

---

## 5. What’s Working Well

- **Clear split:** Frontend (Next.js, Redux, AuthContext) and Backend (Express, Mongoose, JWT/Auth0).  
- **Registration:** Full flow with OTP and all required fields (contactNumber, nationality, dateOfBirth).  
- **Direct-register API:** Implemented and Basic Auth protected.  
- **Dashboard layout:** Sidebar + header in `LayoutContent.client.tsx`; settings page full width.  
- **Env:** Backend and frontend use env vars for API URL and secrets.  
- **Logging:** Backend has request IDs and structured logging.

---

## 6. Issues & Fixes (Checklist)

### 6.1 Fixed in This Pass

- **Backend `app.ts`:** Removed stray `);` after `app.all('*', ...)` so 404 handler is valid.

### 6.2 Naming / Consistency

- **User model filename:** `user.mode.ts` (typo). Works everywhere, but renaming to `user.model.ts` would require updating all imports (controllers, services, middleware, utils). Optional cleanup.

### 6.3 Frontend

- **API base URL:** Ensure `NEXT_PUBLIC_SERVER_URI` is set in `.env`/`.env.local` and ends with `/api/v1` or `/api/v1/` consistently (some code concatenates paths without a slash).  
- **Refresh token URL:** In `axiosInstance.ts` the refresh call uses `${process.env.NEXT_PUBLIC_SERVER_URI}/refreshtoken` — if base URL already has a trailing slash, you get `//refreshtoken`. Prefer one pattern (e.g. base without trailing slash, then `\`${base}/refreshtoken\``).  
- **Duplicate auth logic:** Both RTK `apiSlice` base query and `axiosInstance` implement 401 → refresh. If some calls use axios and some RTK, both paths stay; otherwise consider centralizing.

### 6.4 Backend

- **CORS:** `app.ts` has a fixed list of origins. For local dev, add `https://app.equalmint.com` (or your frontend URL) if needed.  
- **Health vs 404:** Health is at `/api/v1/health`. The catch‑all `app.all('*', ...)` is after all routes, so it only hits when no route matches. Correct.

### 6.5 Security / Ops

- **Secrets:** All secrets (JWT, Auth0, SMTP, `DIRECT_REGISTER_*`) must come from env; never commit real values.  
- **Direct-register:** Keep Basic Auth credentials secret and only use for trusted scripts/admin.

---

## 7. Environment Variables You Must Set

**Never commit real values.** Use env files (and ensure `.env` is in `.gitignore`).

### Backend (.env)

- `PORT`, `DB_URI`  
- `ACCESS_TOKEN`, `REFRESH_TOKEN`, `ACTIVATION_SECRET`, `ACCESS_TOKEN_EXPIRE`, `REFRESH_TOKEN_EXPIRE` (JWT)  
- `CLIENT_URL` or `FRONTEND_URL` (for activation links and redirects)  
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_EMAIL`, `SMTP_PASSWORD` (for activation and password reset emails)  
- Auth0: `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_CALLBACK_URL`, `AUTH0_AUDIENCE`  
- Optional: `DIRECT_REGISTER_AUTH_USER`, `DIRECT_REGISTER_AUTH_PASSWORD` for direct-register API  
- Optional: `HOST` (e.g. `127.0.0.1`) for server binding  
- Optional: `REDIS_URL` (if Redis is used), `CLOUDINARY_URL` (for uploads), `SERVER_URL` (if referenced in code). CORS origins are set in `app.ts` (not env in current code).

### Frontend (.env / .env.local)

- `NEXT_PUBLIC_SERVER_URI` — backend base (e.g. `https://api.equalmint.com/api/v1`); prefer no trailing slash when concatenating paths.

---

## 8. Quick Reference: Key Files

| Purpose | File |
|--------|------|
| Frontend auth state | `Frontend/src/redux/features/auth/authSlice.ts`, `authApi.ts` |
| Auth context (what components use) | `Frontend/src/contexts/AuthContext.tsx` |
| API base + refresh | `Frontend/src/redux/features/api/apiSlice.ts`, `Frontend/src/utils/axiosInstance.ts` |
| Login UI | `Frontend/src/app/(login)/login/page.tsx` |
| Register UI | `Frontend/src/app/(registration)/registration-form/page.tsx` |
| OTP verify UI | `Frontend/src/app/(verification)/verification/page.tsx` |
| Dashboard layout | `Frontend/src/app/(userdashboard)/LayoutContent.client.tsx` |
| Backend user API | `Backend/controllers/user.controller.ts` |
| Backend routes | `Backend/routes/user.route.ts`, `Backend/app.ts` |
| User schema | `Backend/models/user.mode.ts` |
| Direct-register | `Backend/controllers/user.controller.ts` (`directRegisterUser`), `Backend/middleware/basicAuth.ts` |

---

## 9. Frontend Route Map (App Router)

All logged-in routes live under `(userdashboard)` and are wrapped by `Protected` + `LayoutContent` (sidebar + header).

| Route | Purpose |
|-------|---------|
| `/dashboard` | Main dashboard (RoleBasedDashboard → EnhancedDashboard or admin) |
| `/settings` | App settings (tabs: Profile, Security, Notifications, etc.; no Wallet tab) |
| `/myprofile` | Profile info, UBI & Financials, Social & Community |
| `/educationhub` | Browse all courses |
| `/educationhub/[courseId]` | Course detail |
| `/my-courses` | User's enrolled courses |
| `/bookmarks` | Saved courses |
| `/governance` | Community proposals & voting |
| `/courses/[courseId]`, `/courses/[courseId]/access` | Course view & access |
| `/create-course` | Create new course |
| `/instructor/dashboard`, `/instructor/my_courses`, `/instructor/earnings`, etc. | Instructor hub |
| `/admin`, `/admin/users`, `/admin/courses`, `/admin/orders`, `/admin/reviews`, `/admin/governance` | Admin panel |
| `/influencer` | Influencer analytics |
| `/analytics` | Platform analytics (admin) |
| `/exchange` | **Placeholder page only** — "Coming soon" token exchange; **no sidebar link** (Exchange was removed from nav). Route still exists. |
| `/dap` | DAP (proposals/fundraising UI) |
| `/purchased`, `/messenger` | Purchased items, messaging |

**Public (no dashboard layout):** `/`, `/(login)/login`, `/(login)/forgot-password`, `/(login)/reset-password`, `/(registration)/registration-form`, `/(verification)/verification`, `/(verification)/activation-link`, `/auth0-success`.

---

## 10. Data Flows (Deep)

### Auth flow (email/password)
1. **Register:** `registration-form` → `POST /api/v1/register` → backend sends OTP email, returns `activationToken` → frontend stores token, redirects to `/verification`.
2. **Verify:** User enters OTP → `POST /api/v1/activate-user` (activation_token + activation_code) → backend creates user with `isVerified: true` → redirect to `/login`.
3. **Login:** `login` → `authApi.login` → `POST /api/v1/login` → backend returns access token (and sets refresh cookie if configured) → Redux `userLoggedIn`, localStorage, redirect `/dashboard`.
4. **Persistence:** On load, `store.ts` reads `user` + `accessToken` from localStorage and dispatches `userLoggedIn`. Then `loadUser` (GET `/me`) runs; if valid, Redux/AuthContext stay in sync.
5. **Refresh:** Any 401 → `apiSlice` baseQuery or axios interceptor calls GET `/refreshtoken` → retry request; if refresh fails, clear storage and `userLoggedOut`.

### Auth flow (Auth0)
1. User clicks Auth0 login → redirect to Auth0 → callback to backend `GET /api/v1/auth/callback` → backend creates/updates user, issues JWT → frontend receives token, stores user, redirects `/dashboard`.

### Course flow
- **Browse:** Education Hub → course list from backend; course detail from `/api/v1/course/:id`.
- **Enroll:** Enroll button → `POST /api/v1/enrollment/enroll/:courseId` → progress tracked via `POST /api/v1/enrollment/progress/:courseId/:lectureId/complete`.
- **Certificates:** Eligibility check → `GET /api/v1/certificate/eligibility/:courseId`; generate → `GET /api/v1/certificate/generate/:courseId`.

### Governance flow
- Proposals: `GET /api/v1/proposal/*` for list/stats; `POST /api/v1/proposal/create` (auth) to create. Backend stores `proposerWallet` (required string); frontend may send user id/name.
- Votes: `POST /api/v1/vote/:proposalId` (auth); backend stores `voterWallet` (required string). These "wallet" fields are legacy naming; they can hold any identifier (e.g. user id) unless you rename in DB.

---

## 11. Gaps & Optional Fixes

| Item | Detail | Action |
|------|--------|--------|
| **Video route not mounted** | `Backend/routes/video.route.ts` exists (signed-url, stream by token, course videos) but is **not** imported or mounted in `app.ts`. Video streaming may rely on `/api/v1/stream/:filename` (static files) or course payloads. | If you need signed URLs or course-scoped video API, add `app.use('/api/v1/video', videoRouter)` (or similar) in `app.ts` and fix typo `isAthenticated` in video.route if present. |
| **Exchange page** | Route `/exchange` and page component exist; sidebar link was removed. Page is a "Coming soon" placeholder. | Optional: remove `(userdashboard)/exchange/page.tsx` and any links to `/exchange` if you want no exchange route at all. |
| **Governance wallet fields** | Backend models `Proposal` and `Vote` have required `proposerWallet` and `voterWallet` (string). Naming is wallet-like; they can store user id or other identifier. | Optional: rename to e.g. `proposerIdRef` / `voterIdRef` and migrate DB if you want to drop "wallet" wording everywhere. |
| **User model filename** | `user.mode.ts` (typo). | Optional: rename to `user.model.ts` and update all imports. |
| **CORS** | `app.ts` uses fixed origins (e.g. production URLs). | For local dev, add `https://app.equalmint.com` (or your frontend URL) to `origin` array. |
| **API base URL trailing slash** | Frontend uses `NEXT_PUBLIC_SERVER_URI`; some code appends paths without a slash. | Prefer one convention: base **without** trailing slash, then `${base}/refreshtoken`, `${base}/me`, etc. |
| **Duplicate refresh logic** | Both RTK `apiSlice` baseQuery and `axiosInstance` (if used) can do 401 → refresh. | If all API calls go through RTK, you can rely on apiSlice only and remove refresh from axios to avoid duplication. |

---

## 12. Summary

- **Architecture:** Next.js frontend + Express backend; JWT + Auth0; Redux + AuthContext for auth.  
- **Registration:** Full OTP flow and a separate direct-register API with Basic Auth.  
- **Startup & contributor:** Completely removed (routes, pages, sidebar, dashboard buttons, modals).  
- **One bug fixed:** `app.ts` 404 handler syntax.  
- **Remaining:** Small consistency cleanups (env trailing slash, optional `user.model` rename), CORS for localhost, centralizing refresh logic; see **Section 11 (Gaps & Optional Fixes)** for video route, exchange page, and governance fields.

Use this doc as the map: follow **Section 4** for critical flows, **Section 9** for frontend routes, **Section 10** for data flows, **Section 6** for checklist, and **Section 11** for gaps and optional fixes.

---

## 13. Deeper Analysis (Mental Model)

- **Single dashboard:** After login, everyone (user, instructor, admin, influencer, and any legacy startup/contributor role) lands on the same dashboard route; admin gets admin panel, others get `EnhancedDashboard`. No separate startup/contributor hubs.
- **Auth is the spine:** Redux `auth` + AuthContext + `/me` and refresh drive "who is logged in." Everything else (sidebar, protected routes, role UI) branches from that.
- **API surface:** Backend is under `/api/v1`; frontend uses one base URL. If something doesn't work, check: (1) env `NEXT_PUBLIC_SERVER_URI`, (2) CORS/origin, (3) cookie/credentials for refresh.
- **Removed surface area:** Fewer routes and roles to reason about; fewer 404s from old links. If you see a link or redirect to `/startup/*` or `/contributor/*`, it's stale and should be removed or pointed to dashboard.
- **Security & ops (deep):** (1) All secrets (JWT, Auth0, SMTP, `DIRECT_REGISTER_*`) must come from env; never commit real values. (2) Direct-register is powerful: keep Basic Auth credentials secret and use only for trusted scripts/admin. (3) CORS is allowlist; add localhost for dev. (4) Refresh token in cookie vs body: ensure frontend and backend agree (credentials: 'include' if cookie). (5) Health at `/api/v1/health`; 404 catch-all is after all routes. (6) Logging: request IDs and advanced logging middleware; DB logger for errors. (7) User model hashes password in pre-save; activation token is short-lived JWT with OTP in payload.