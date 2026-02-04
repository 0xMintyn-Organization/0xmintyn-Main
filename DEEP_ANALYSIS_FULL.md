# Very Deep Project Analysis — Equalmint (0xmintyn)

This document is an **extremely detailed** analysis of both backend and frontend so you can confidently add new features. Use it when you feel stuck or before adding new things.

---

## Part 1: Backend — Deep Dive

### 1.1 How the Backend Starts

1. **`server.ts`** creates an HTTP server from `app` (Express), connects DB, initializes Socket.IO, binds to `HOST:PORT` from env.
2. **`app.ts`** is the Express app: middleware chain → routes → 404 → error handler.

**Middleware order (every request):**
1. `requestIdMiddleware` — adds `x-request-id`
2. `advancedRequestLogger` — logs request
3. `express.json()` / `urlencoded()` — body parsing (100mb limit)
4. `cookieParser()` — so `req.cookies` works
5. `cors({ origin: [...], credentials: true })` — allow listed origins with credentials
6. Static: `/uploads` → `./uploads`
7. Then **routes** (see below)
8. Catch-all: `app.all('*', ...)` → 404
9. `ErrorMiddleware` — formats errors, logs, sends JSON

### 1.2 Auth: Cookies Only (Critical)

- **Backend never reads `Authorization` header.** All protected routes expect **cookies**: `access_token`, `refresh_token`.
- **`utils/auth.ts`** — `isAthenticated`: reads `req.cookies.access_token`, verifies JWT, loads user, sets `req.user`. Typo in name: `isAthenticated` (used everywhere).
- **`controllers/user.controller.ts`** — `updateAccessTokenMiddleware`: reads **only** `req.cookies.refresh_token`. If present and valid, issues new access + refresh cookies, sets `req.user`, calls `next()`. So **every protected route** that uses this middleware runs: refresh from cookie → set user → then `isAthenticated` (which reads access_token). So order is: refresh middleware first, then auth. If access is expired but refresh is valid, the refresh middleware refreshes cookies and sets user; `isAthenticated` then runs and might still read the old access_token… Actually in user.route, order is `updateAccessTokenMiddleware, isAuthenticated`. So the **refresh middleware** runs first: it uses **refresh_token** cookie to get user and set new cookies, then calls next. Then **isAuthenticated** runs and reads **access_token**. So for auth to work, either: (1) access_token is valid, or (2) refresh_token is valid and refresh middleware runs first. But `isAuthenticated` does NOT call refresh — it just fails if access_token is missing/invalid. So the flow is: **Protected routes use updateAccessTokenMiddleware first** so that when you call e.g. GET /me, the backend first tries to refresh from refresh_token cookie and set new access_token cookie; then isAuthenticated runs. But isAuthenticated only reads access_token — it doesn't use the user set by refresh middleware. So actually the **order** is: updateAccessTokenMiddleware (refresh from refresh_token, set new cookies, set req.user) → isAuthenticated (read access_token). So if access_token is expired, isAuthenticated would fail even though refresh middleware already set req.user. So there may be a logic bug: after refresh middleware sets req.user, isAuthenticated still runs and requires access_token. So for the flow to work, the **refresh middleware** must be run on every request and it must **replace** the need for access_token when it successfully refreshes. Looking at the code again: updateAccessTokenMiddleware sets req.user and next(). Then isAuthenticated runs and checks req.cookies.access_token. So if access was expired, refresh middleware refreshed and set new access_token cookie; but the **current request** already has the old cookie in the request. So the next middleware (isAuthenticated) still sees the old expired access_token. So either: (1) the response has already been sent with Set-Cookie (new tokens), and the next middleware runs in the same request — so isAuthenticated still sees old cookie. So we'd need isAuthenticated to also accept "if req.user is already set by refresh middleware, skip token check". Let me check — in user.route it's `updateAccessTokenMiddleware, isAuthenticated, getUserInfo`. So when refresh runs, it sets req.user and next(). Then isAuthenticated runs: it reads access_token from cookie. So the cookie sent by the client is the old one; the refresh middleware set new cookies in the **response**. So on this same request, isAuthenticated sees the OLD access_token (expired). So it would return 401! So there might be a bug: after refresh, the same request continues with isAuthenticated which fails. Unless the backend is supposed to send tokens in response body and frontend uses them for the next request — but backend auth only reads cookies. So the fix would be: in isAuthenticated, if req.user is already set (by refresh middleware), skip the token check and call next(). I'll note this in the doc as a potential bug. For the analysis doc I'll describe the intended flow: cookies, refresh middleware first, then auth.
- **Login response:** `sendToken()` in `utils/jwt.ts` sets `access_token` and `refresh_token` **cookies** and also returns `{ user, accessToken }` in JSON. Frontend stores accessToken in localStorage and uses `credentials: 'include'` so cookies are sent on same-origin or CORS-allowed requests.
- **Refresh:** GET `/refreshtoken` reads `refresh_token` cookie only; returns new cookies + `{ accessToken, user }` in body.

**Summary:** Frontend must send **cookies** (credentials: 'include'). Base URL must match CORS origin. If frontend and backend are on different ports (e.g. 3000 vs 8000), ensure CORS has that origin and cookies are not blocked (SameSite, Secure in prod).

### 1.3 Route Groups (What’s Mounted)

| Mount path        | Router / file              | Purpose |
|-------------------|----------------------------|--------|
| `/api/v1`         | userRouter                 | register, register-direct, activate-user, activate-link, login, logout, forgot-password, reset-password, refreshtoken, me, users, update-user-info, update-username, change-password, social-auth, update-user-avatar, update-user-banner, apply-instructor, toggle-seller-status, update-social-account, remove-social-account, instructor-stats/:id |
| `/api/v1/health`  | healthRouter               | health, health/detailed, health/crash-report |
| `/api/v1/upload`  | uploadRoutes               | Avatar, banner, course thumbnails/videos (multer + Cloudinary) |
| `/api/v1/stream`  | streamRoutes               | GET /:filename — static file from uploads/videos |
| `/api/v1/course`  | coursesRoutes              | create, /, /:id, enrolled-course/:id, instructor/my-courses, /:id (PUT/DELETE), create-professional, admin/all, admin/:id/status, admin/:id |
| `/api/v1/analytics` | analyticsRoutes          | GET /, GET /instructor |
| `/api/v1/role`    | roleRoutes                 | dashboard, users, users/:userId/role, users/:userId (GET/PUT), request-instructor |
| `/api/v1/enrollment` | enrollmentRoutes        | enroll/:courseId, my-courses, check/:courseId, access/:courseId, orders, orders/:orderId, orders/:orderId/status, progress/:courseId/:lectureId/complete, progress/:courseId |
| `/api/v1/certificate` | certificateRoutes      | generate/:courseId, eligibility/:courseId |
| `/api/v1/bookmark` | bookmarkRoutes             | add, remove/:courseId, my-bookmarks, status/:courseId, count |
| `/api/v1/review`   | reviewRoutes               | course/:courseId, can-review/:courseId, create, /:reviewId (PUT/DELETE), admin/all, admin/:reviewId |
| `/api/v1/note`     | noteRoutes                 | course/:courseId (GET/DELETE), save (POST) |
| `/api/v1`          | instructorRoutes           | instructor-stats/:instructorId, instructor/dashboard, instructor/analytics, instructor/students, instructor/earnings |
| `/api/v1/admin`    | adminRoutes                | users, orders |
| `/api/v1/dashboard` | dashboardRouter          | totalusers, totalinstructors, totalcourses, avgrating, topinstructors, trendingcategories, recentactivity |
| `/api/v1/influencer` | influencerRouter        | analytics |
| `/api/v1/proposal` | proposalRoutes             | stats, top, all, :proposalId, create, user/:userId, :proposalId/status (PATCH), :proposalId (DELETE) |
| `/api/v1/vote`     | voteRoutes                 | :proposalId (POST/PUT/DELETE), :proposalId/stats, :proposalId/votes, user/:userId |
| `/api/v1`          | auth0Router                | auth0/login, auth/callback, auth0/link, auth0/unlink |

**Not mounted:** `video.route.ts` (signed-url, stream by token, course videos). Video streaming currently uses `/api/v1/stream/:filename` or course payloads.

### 1.4 Auth Middleware Pattern on Routes

- **No auth:** register, register-direct (Basic Auth), activate-user, activate-link, login, forgot-password, reset-password, refreshtoken, health, GET course list, GET course by id.
- **Auth (cookie):** Almost everything else uses `updateAccessTokenMiddleware` then `isAthenticated` (from `utils/auth`). So: refresh from cookie first, then require access_token (or accept req.user if you add that check).
- **Role:** `requireAdmin`, `requireInstructorOrAdmin`, `requireInfluencerOrAdmin` from `middleware/roleAuth.ts` — check `req.user.role`.

### 1.5 Models (MongoDB / Mongoose)

| Model file            | Collection | Key fields / purpose |
|-----------------------|------------|----------------------|
| user.mode.ts          | User       | firstName, lastName, email, username, password, contactNumber, nationality, dateOfBirth, age, role (user\|instructor\|admin\|influencer), isVerified, isSeller, avatar, banner, bio, instructorHeadline/Bio/Status, socialAccounts, purchasedProducts/Services/Items. Pre-save hashes password. Methods: comparePassword, SignAccessToken, SignRefreshToken. |
| course.model.ts       | Course     | name, description, categories, level, price, estimatedPrice, tags, benefits, prerequisites, thumbnail, demoUrl, createdBy, courseData (sections with videos), reviews (subdoc), averageRating, totalReviews. |
| order.model.ts        | Order      | courseId, userId, courseName, coursePrice, courseThumbnail, instructorId, instructorName, status (pending\|completed\|cancelled\|refunded), payment_info, enrolledAt, completedAt, completedLectures. |
| bookmark.model.ts     | Bookmark   | user, course refs. |
| review.model.ts       | Review     | (check usage — course has embedded reviews too). |
| note.model.ts         | Note       | user, course, content. |
| governance/proposal.model.ts | Proposal | title, category, proposerName, proposerWallet, proposerId, summary, detailedDescription, votingOptions, status, startDate, endDate, etc. |
| governance/vote.model.ts     | Vote    | proposalId, voterId, voterName, voterWallet, vote (yes\|no\|abstain), votingPower. |

### 1.6 Controllers Pattern

- Use `CatchAsyncError` wrapper.
- Use `ErrorHandler` for business errors (status + message).
- User controller: `registrationUser`, `directRegisterUser`, `activateUserAccount`, `activateUserAccountByLink`, `loginUser`, `logoutUser`, `updateAccessToken`, `updateAccessTokenMiddleware`, `getUserInfo`, `updateProfile`, etc. Many depend on `req.user` set by middleware.

---

## Part 2: Frontend — Deep Dive

### 2.1 Provider Tree (Order Matters)

```
layout.tsx (root)
  → Providers (Provider.tsx)
      → Redux Provider (store)
          → AuthProvider (AuthContext)
              → AutoLogoutProvider
                  → { children }  (all app pages)
```

- **Redux store:** `apiSlice` + `auth` slice. On create, if browser: read `user` and `accessToken` from localStorage and dispatch `userLoggedIn`. Then async: dispatch `loadUser` (GET /me) to revalidate.
- **AuthContext:** Uses `useLoadUserQuery` (RTK), Redux selectors; exposes `user`, `isAuthenticated`, `isLoading`, `refetchUser`, `logout`. So components use `useAuth()` from AuthContext, which is backed by Redux + /me.
- **useAuth()** in code: actually from `userAuth.tsx` which re-exports `useAuth` from AuthContext. So `useAuth()` = AuthContext.
- **useProtected:** Uses `useAuth()`; if !isAuthenticated or !user, redirect to /login; else render children. Dashboard page wraps content in `<Protected>` (useProtected component).

### 2.2 Auth Flow (Frontend)

1. **Login:** Login page → `authApi.login({ email, password })` → POST /api/v1/login with credentials: include → backend sets cookies and returns { user, accessToken } → onQueryStarted: localStorage set user, accessToken; dispatch userLoggedIn → redirect /dashboard.
2. **Persistence:** Store created with localStorage hydrate → userLoggedIn. Then loadUser (GET /me) runs; if success, result.data.user used to update Redux + localStorage again.
3. **Protected route:** Layout (userdashboard) wraps children in `<Protected>`. Protected uses useAuth(); if !isAuthenticated redirect /login.
4. **Refresh on 401:** apiSlice baseQueryWithReauth: on 401, GET refreshtoken (credentials: include), then retry; if refresh fails, clear storage and userLoggedOut.

**Important:** All API calls that need auth must send **cookies**. So baseUrl must be the backend and `credentials: 'include'` (RTK and axios use this). No Authorization header is set by default — backend doesn’t read it anyway.

### 2.3 How Data Is Fetched (Two Ways)

1. **RTK Query (apiSlice + injectEndpoints):**  
   - authApi: register, activation, login, socialAuth, logOut, forgotPassword, resetPassword.  
   - userApi: updateAvatar, updateBanner, editProfile, editUsername, updatePassword, updateSocialAccount, etc.  
   - apiSlice: loadUser, refreshToken.  
   - Other slices: userApi, order, ebook, etc.  
   Uses baseUrl = NEXT_PUBLIC_SERVER_URI, credentials: 'include'. Paths are relative (e.g. "login", "me", "update-user-avatar"). So baseUrl must end with /api/v1 (or /api/v1/) so that "me" → /api/v1/me.

2. **Axios (services):**  
   - roleService: getRoleDashboard, getAllUsers, updateUserRole, etc. Uses axios.get(API_BASE_URL + path, { withCredentials: true }).  
   - **Bug fixed:** API_BASE_URL was concatenated without slash (e.g. API_BASE_URL + "role/dashboard") so URL could be wrong. Fixed to API_BASE_URL + "/role/dashboard" (ensure base has no trailing slash or path has leading slash consistently).  
   - enrollmentService and any other axios-based services: same pattern — withCredentials: true, base URL from env.

### 2.4 Key Hooks and Components

- **useAuth()** — from AuthContext: user, isAuthenticated, isLoading, refetchUser, logout.
- **useRole()** — from Redux state.auth: user, isAuthenticated, hasRole(roles), isAdmin(), isInstructor(), requireRole(), etc. Used for sidebar, dashboard, role-based UI.
- **useProtected** — component that redirects to /login if not authenticated.
- **RoleBasedDashboard** — uses useRole(), useLoadUserQuery(), roleService.getRoleDashboard(). If admin → AdminDashboard; else → EnhancedDashboard.
- **Sidebar (SidebarContent)** — uses useRole(), useBookmarkCount(), useGovernanceStats(), useTotalCourses(); getNavItems(role, ...) returns nav items; admin gets admin items, instructor gets instructor items, etc.

### 2.5 App Router Structure (Frontend)

- **Public:** `/` (page.tsx), `/(login)/login`, `/(login)/forgot-password`, `/(login)/reset-password`, `/(registration)/registration-form`, `/(verification)/verification`, `/(verification)/activation-link`, `/auth0-success`.
- **(userdashboard):** layout = ThemeProviderWrapper → Protected → SidebarProvider → LayoutContent (sidebar + header + main). Children: dashboard, settings, myprofile, educationhub, governance, courses, create-course, instructor/*, admin/*, influencer, analytics, exchange (placeholder), dap, purchased, messenger, my-courses, bookmarks. All under same layout so sidebar and header are shared.

### 2.6 Redux State Shape

- **state.api** — RTK Query cache (endpoints, loadUser, etc.).
- **state.auth** — { user, token (accessToken), isAuthenticated }. Updated by userLoggedIn, userLoggedOut, userRegistration; and by loadUser onQueryStarted.

---

## Part 3: End-to-End Data Flow (Examples)

### 3.1 User Opens Dashboard

1. Request hits (userdashboard)/dashboard/page.tsx → renders Protected → RoleBasedDashboard.
2. Protected: useAuth() → isLoading from loadUser query; isAuthenticated from Redux. If not authenticated → redirect /login.
3. RoleBasedDashboard: useLoadUserQuery(), useRole(), roleService.getRoleDashboard(). GET /me and GET /api/v1/role/dashboard (cookies sent). Admin → AdminDashboard with stats; else EnhancedDashboard.
4. Sidebar: useRole() for nav items; useBookmarkCount(), useGovernanceStats(), useTotalCourses() for badges.

### 3.2 User Enrolls in Course

1. Frontend: POST /api/v1/enrollment/enroll/:courseId (credentials: include). Middleware: updateAccessTokenMiddleware → isAthenticated. Controller: enrollInCourse (creates order, updates user’s purchased/order state).
2. Frontend might use enrollmentService or RTK; either way cookies are sent.

### 3.3 Add New Feature (Conceptual)

- **New API:** Add route in appropriate router (or new router) in Backend/routes; add controller in Backend/controllers; use existing auth/role middleware. Mount in app.ts.
- **New page:** Add folder under Frontend/src/app/(userdashboard)/newfeature/page.tsx; wrap in Protected if needed; add sidebar link in SidebarContent getNavItems if needed.
- **New RTK endpoint:** apiSlice.injectEndpoints or new slice; use baseUrl + path, credentials: 'include'.
- **New role:** Backend user role enum already has user, instructor, admin, influencer. Add role check in roleAuth if needed; frontend useRole() and getNavItems() already branch on role.

---

## Part 4: How to Add New Things (Step-by-Step)

### 4.1 Add a New Backend API (e.g. “Get my certificates list”)

1. **Controller:** In `Backend/controllers/certificate.controller.ts` (or new file), add a function e.g. `getMyCertificates = CatchAsyncError(async (req, res) => { ... })`. Use `req.user._id`, query Certificate or Orders, return list.
2. **Route:** In `Backend/routes/certificate.route.ts`, add `router.get('/my-list', updateAccessTokenMiddleware, isAthenticated, getMyCertificates)`.
3. **Mount:** Already under `/api/v1/certificate` in app.ts. So new endpoint = GET `/api/v1/certificate/my-list`.
4. **Auth:** Cookies sent automatically; middleware runs in order.

### 4.2 Add a New Frontend Page (e.g. “My Certificates”)

1. **Page file:** Create `Frontend/src/app/(userdashboard)/my-certificates/page.tsx`. Use `'use client'` if you use hooks. Wrap in `<Protected>` if the whole page is protected (or rely on layout). Fetch with RTK or axios: e.g. `useGetMyCertificatesQuery()` or `certificateService.getMyList()` with credentials.
2. **Sidebar link:** In `Frontend/src/components/Sidebar/SidebarContent.tsx`, in `getNavItems`, add an item e.g. `{ name: 'My Certificates', href: '/my-certificates', icon: Award }` to the right array (publicItems or role-specific).
3. **Env:** Ensure `NEXT_PUBLIC_SERVER_URI` points to backend (e.g. `https://localhost:8000/api/v1` or your backend base).

### 4.3 Add a New RTK Query Endpoint

1. In `Frontend/src/redux/features/api/apiSlice.ts` or a feature slice (e.g. certificateApi), use `apiSlice.injectEndpoints`:  
   `getMyCertificates: builder.query({ query: () => ({ url: 'certificate/my-list', method: 'GET', credentials: 'include' }) })`.  
   Export hook: `useGetMyCertificatesQuery`.
2. In your page: `const { data, isLoading } = useGetMyCertificatesQuery();`. Base URL is already set; path is relative to it.

### 4.4 Add a New Role or Restrict by Role

1. **Backend:** In `Backend/models/user.mode.ts`, role enum is `['user', 'instructor', 'admin', 'influencer']`. If you need a new role, add it and migrate. In `Backend/middleware/roleAuth.ts`, add e.g. `requireNewRole = requireRole(['newrole'])` and use on routes.
2. **Frontend:** In `useRole.tsx`, add e.g. `isNewRole = () => hasRole('newrole')`. In SidebarContent `getNavItems`, add items for that role in the combine step.

### 4.5 Add a New Model and CRUD

1. **Model:** Create `Backend/models/myentity.model.ts` with Mongoose schema. Export model.
2. **Controller:** Create `Backend/controllers/myentity.controller.ts` with create, read, update, delete using req.user where needed.
3. **Routes:** Create `Backend/routes/myentity.route.ts`; use updateAccessTokenMiddleware, isAthenticated, requireRole if needed; wire controller methods.
4. **Mount:** In app.ts, `import myentityRoutes from './routes/myentity.route';` and `app.use('/api/v1/myentity', myentityRoutes);`.
5. **Frontend:** Add page(s) and API calls (RTK or axios) as above.

---

## Part 5: Fixes Applied and Things to Watch

### 5.1 Fixes Applied in This Pass

- **roleService URLs:** All calls now use `${API_BASE_URL}/role/...` (leading slash before "role") so that with baseUrl like `https://localhost:8000/api/v1`, the path is `/role/dashboard` not `role/dashboard`. This prevents 404 when baseUrl has no trailing slash.

### 5.2 Things to Watch

- **Auth cookie vs cross-origin:** If frontend is on different origin (e.g. localhost:3000 vs localhost:8000), CORS must allow that origin with credentials. Backend already has credentials: true. Add `http://localhost:3000` to origin list for local dev (already present in app.ts).
- **Video route:** `video.route.ts` is not mounted. If you need signed video URLs or course-scoped video API, mount it in app.ts.
- **updateAccessTokenMiddleware vs isAthenticated:** Both run on protected routes. If access_token is expired, refresh middleware can set new cookies and req.user, but isAthenticated still reads the old cookie in the same request and may return 401. If you see “logged out” right after refresh, consider letting isAthenticated skip check when req.user is already set by previous middleware.
- **NEXT_PUBLIC_SERVER_URI:** Should be backend base including /api/v1, e.g. `https://localhost:8000/api/v1` (no trailing slash is safer when concatenating paths).

---

## Quick Reference: Where to Touch When Adding…

| I want to…              | Backend                          | Frontend |
|-------------------------|----------------------------------|----------|
| New API endpoint        | routes/*.ts + controller        | Call it (RTK or axios with credentials) |
| New page                | —                                | app/(userdashboard)/new/page.tsx + sidebar link |
| New role                | user.mode.ts enum, roleAuth      | useRole, SidebarContent getNavItems |
| New model/CRUD          | models/*.ts, controller, route, app.ts | Pages + API calls |
| Change auth (e.g. header)| utils/auth.ts, updateAccessTokenMiddleware | Send header in RTK/axios |

You now have a full map of backend and frontend and a clear pattern for adding new things. Use this doc next time you add a feature or debug auth/API issues.
