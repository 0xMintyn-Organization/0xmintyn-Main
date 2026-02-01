# Marketplace Module – Implementation Analysis (Registration → Current)

**Scope:** What we built from registration through to the current level (Phase 1 + Phase 2 + startup-only UI).

---

## 1. High-Level Flow

```
Registration (choose Startup or Contributor)
    → Activation (OTP or link)
    → Login
    → [Startup] Onboarding gate (complete profile) → Startup Dashboard only
    → [Contributor] No onboarding gate → Main platform (Education, Governance, etc.)
```

- **Platform role** stays `user` for both; **marketplace identity** is separate: `marketplace_role` = `startup` | `contributor`.
- **Startups** see only the startup hub (Dashboard + Profile). **Contributors** see the full platform as before.

---

## 2. Phase 1: Foundation (User + Registration)

### 2.1 Backend

| Area | What we did |
|------|-------------|
| **User model** (`Backend/models/user.mode.ts`) | Added `marketplace_role` (enum: `startup` \| `contributor`), `startupName`, `startupDescription` (optional). |
| **Registration API** | Accepts `marketplace_role` (required), `startupName` (required when `marketplace_role === 'startup'`), `startupDescription` (optional). Validates and stores in activation token. |
| **Activation (OTP + link)** | On account creation, sets `role: 'user'` and copies `marketplace_role`, `startupName`, `startupDescription` from token into the new user. |
| **Direct register API** | Same optional `marketplace_role` / `startupName` / `startupDescription`; persists when provided. |
| **Login** | Returns full user (including `marketplace_role` and startup fields). Logs `role` and `marketplace_role` (dev). |
| **GET /me** | Returns full user (includes `marketplace_role`, `startupName`, `startupDescription`). |

### 2.2 Frontend

| Area | What we did |
|------|-------------|
| **Registration form** (`(registration)/registration-form/page.tsx`) | Two options: “Sign up as Startup” / “Sign up as Contributor”. When Startup is selected, shows **Startup name** (required) and **Description** (optional). Zod validates `marketplace_role` and `startupName` when startup. |
| **Auth types** | `AuthContext` and registration payload include `marketplace_role`, `startupName`, `startupDescription`. |
| **Login** | Redux and localStorage store full user; console logs `role` and `marketplace_role` on success. |

**Result:** Users can register as Startup or Contributor; data is stored on User; activation and login work; single login for both.

---

## 3. Phase 2: Profile Completion & Onboarding Gates

### 3.1 Backend

| Area | What we did |
|------|-------------|
| **User model** | Added `startupOnboardingComplete` and `contributorOnboardingComplete` (Boolean, default `false`). |
| **APIs** | `PUT /me/onboarding/startup` (optional body: `startupName`, `startupDescription`) sets `startupOnboardingComplete = true`. `PUT /me/onboarding/contributor` sets `contributorOnboardingComplete = true`. Both require auth and check `marketplace_role`. |

### 3.2 Frontend – Onboarding (Startup Only)

| Area | What we did |
|------|-------------|
| **Onboarding redirect** | `getOnboardingRedirectPath(user)` returns `/onboarding/startup` only when `marketplace_role === 'startup'` and `!startupOnboardingComplete`. **Contributors are not gated** (no contributor onboarding page). |
| **Route** | `/onboarding/startup` – form to confirm/update startup name and description; submit calls `completeStartupOnboarding` then redirects to `/startup/dashboard`. |
| **Guard** | In `useProtected`: if user needs onboarding (startup incomplete), redirect to `/onboarding/startup` before rendering main or startup app. |

**Result:** Incomplete startup users must complete onboarding; contributors go straight to the platform.

---

## 4. Startup-Only UI (Post–Phase 2)

### 4.1 Routing and layout

| Area | What we did |
|------|-------------|
| **Post-login path** | `getPostLoginPath(user)` – startup users (and users with `startupName`, for legacy) go to `/startup/dashboard`; others to `/dashboard`. |
| **Startup detection** | `isStartupUser(user)` = `marketplace_role === 'startup'` **or** `user.startupName` (legacy). Used everywhere we branch on “startup”. |
| **Main app guard** | In `useProtected` (used by `(userdashboard)`): if `isStartupUser(user)` and path is **not** under `/startup`, redirect to `/startup/dashboard`. So startup users never see Education, Governance, or main dashboard. |
| **Startup app** | Route group `(startup)` with path segment `startup`: `/startup/dashboard`, `/startup/profile`. Layout: `Protected` + “only startup users”; others redirect to `/dashboard`. |

### 4.2 Startup UI structure

| Route | Purpose |
|-------|---------|
| **`/startup/dashboard`** | Startup Hub dashboard: welcome, startup name, placeholders for Profile and Milestones. |
| **`/startup/profile`** | Read-only startup profile (name, description, email). |
| **Layout** | Minimal sidebar: “Startup Hub” logo, **Dashboard**, **Profile**. Header: theme toggle + logout. No Education, Governance, or main-platform nav. |

### 4.3 Where redirects happen

- **Login success** – `onboardingPath || getPostLoginPath(data.user)` → startup → `/onboarding/startup` or `/startup/dashboard`; contributor → `/dashboard`. Uses `router.replace`. |
- **Home (`/`)** – Same logic: onboarding path or `getPostLoginPath(userForRedirect)`. |
| **Auth0 success** | Same: onboarding path or `getPostLoginPath(userData.user)`. |
| **Protected (main app)** | Startup user on any main path → `/startup/dashboard`. |
| **Startup layout** | Non-startup user on `/startup/*` → `/dashboard`. |

**Result:** Startup users only see the startup hub; contributors see the platform as before.

---

## 5. File-Level Summary

### Backend

- **`models/user.mode.ts`** – `marketplace_role`, `startupName`, `startupDescription`, `startupOnboardingComplete`, `contributorOnboardingComplete`.
- **`controllers/user.controller.ts`** – Registration/activation/direct register with marketplace fields; `completeStartupOnboarding`, `completeContributorOnboarding`; login returns full user.
- **`routes/user.route.ts`** – `PUT /me/onboarding/startup`, `PUT /me/onboarding/contributor`.

### Frontend

- **`lib/onboarding.ts`** – `getOnboardingRedirectPath`, `getPostLoginPath`, `isStartupUser`.
- **`hooks/useProtected.tsx`** – Auth check, onboarding redirect, startup redirect to `/startup/dashboard`.
- **`app/(registration)/registration-form/page.tsx`** – Startup/Contributor choice; startup name/description when Startup.
- **`app/onboarding/startup/page.tsx`** – Startup onboarding form; submit → `/startup/dashboard`.
- **`app/(startup)/layout.tsx`** – Startup-only layout (minimal sidebar + header).
- **`app/(startup)/startup/dashboard/page.tsx`** – Startup dashboard.
- **`app/(startup)/startup/profile/page.tsx`** – Startup profile.
- **`app/(login)/login/page.tsx`** – Redirect after login via onboarding path + `getPostLoginPath`.
- **`app/page.tsx`** – Home redirect uses same logic.
- **`app/auth0-success/page.tsx`** – Social login redirect uses same logic.
- **`contexts/AuthContext.tsx`** – User type includes marketplace and onboarding fields.
- **`redux/features/auth/authApi.ts`** – `completeStartupOnboarding`, `completeContributorOnboarding` mutations; login stores full user.

---

## 6. What We Did Not Do (Yet)

- **Contributor onboarding** – No page or gate; contributors go straight to the main app.
- **Phase 3+** – No `StartupProfile` / `ContributorProfile` collections, milestones, applications, or funding.
- **Startup dashboard content** – Placeholder only; no real milestones or hiring yet.

---

## 7. Quick Reference: User Journeys

| User type | Registration | After activation | Login | After login |
|-----------|--------------|-------------------|-------|-------------|
| **Startup** | Choose Startup, enter name (+ optional description) | User created with `marketplace_role: startup`, `startupOnboardingComplete: false` | Same login | If onboarding incomplete → `/onboarding/startup`; else → `/startup/dashboard`. Only sees startup hub. |
| **Contributor** | Choose Contributor | User created with `marketplace_role: contributor` | Same login | → `/dashboard`. Sees full platform. |
| **Legacy (has startupName, no marketplace_role)** | N/A | N/A | Same login | Treated as startup via `isStartupUser` → `/startup/dashboard`. |

---

*This document reflects the implementation from registration through the current “startup-only UI” behavior (Phase 1 + Phase 2 + startup isolation).*
