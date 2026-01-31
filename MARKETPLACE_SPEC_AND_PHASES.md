# EqualMint Marketplace Module – Technical Specification & Development Phases

**Startup & Contributor Integration (Minimal · Smart · Scalable)**

This document is the single source of truth for the marketplace module: full technical specification and an **8-phase development roadmap** to implement it properly without missing anything.

---

## Part A: Technical Specification

### 1. Objective & Philosophy

This document defines a **minimal and production-ready** implementation plan for integrating **Startup** and **Contributor** marketplace modules into the existing EqualMint platform.

- **Design goals:** Avoid role explosion, preserve existing roles, introduce a clean marketplace abstraction that controls UI, access, workflows, and funding.
- **Outcome:** A simple, low-complexity marketplace system enabling accountable funding, clear roles, and scalable growth.

---

### 2. Core Design Principles

| Principle | Description |
|-----------|-------------|
| **No changes to existing user roles** | Platform roles (user, instructor, admin, influencer) stay as-is. Marketplace is an additional dimension. |
| **Marketplace identity is independent** | `marketplace_role`: `startup` \| `contributor`. Decoupled from platform role. |
| **Backward compatibility guaranteed** | Existing users and flows continue to work. New fields and collections are additive. |
| **UI isolation for startups** | Startup users get a dedicated, isolated UI (no education/governance/marketplace browse). |
| **Milestone-based funding** | Funding is tied to milestones. Clear lifecycle and verification steps. |
| **Admin-controlled payouts** | Only admin can release payments after verification. No automatic payouts. |

---

### 3. User & Marketplace Identity

- **Existing roles remain intact.** No change to `role` enum: `user`, `instructor`, `admin`, `influencer`.
- **New: `marketplace_role`** (optional on User): `startup` \| `contributor`. Defines marketplace identity.
- **A user can be** e.g. `role: user` + `marketplace_role: contributor`, or `role: instructor` + `marketplace_role: contributor`. Platform role and marketplace role are independent.
- **Startup users:** `marketplace_role: startup` (platform role typically `user`).  
- **Contributor users:** `marketplace_role: contributor` (can still be instructor/influencer).

**Current implementation (Phase 1 done):** User schema has `marketplace_role`, `startupName`, `startupDescription`. Registration includes marketplace selection; both identities stored in the same User document for a single login.

---

### 4. Signup & Forced Onboarding

- **Signup includes marketplace selection.** User must choose “Startup” or “Contributor” at registration.
- **Startup users** must complete **startup details** (e.g. startup name; extended profile in StartupProfile later). Access is blocked until completion.
- **Contributors** must complete **contributor profiles** (skills, portfolio, payment info, etc.). Access is blocked until completion.
- **Implementation note:** “Access blocked until completion” implies an onboarding/completion flag (e.g. `startupProfileCompleted`, `contributorProfileCompleted`) and middleware or guards that redirect incomplete users to the right onboarding step instead of main app.

---

### 5. Startup Module Scope

- **Startup profiles** store: identity, funding state, milestones, and positions.
- **Startups** can: manage hiring, create milestones, verify work, request/trigger payouts (admin actually releases).
- **Startups do not get access to:** education module, governance module, or general marketplace browse (they see only their own startup hub).
- **UI:** Isolated startup dashboard and pages (see Frontend Architecture).

---

### 6. Contributor Module Scope

- **Contributors** maintain: skills, portfolio, payment info, earnings, and availability.
- **Contributors** can: browse startups, apply to milestones, chat (with startups/context), submit deliverables, track earnings.
- **UI:** Contributor experience integrates with the existing platform (same shell, plus contributor-specific nav and pages).

---

### 7. Milestone Lifecycle

Single canonical lifecycle for every milestone:

```
Open → In Progress → Submitted → Startup Verified → Admin Verified → Paid
```

| State | Meaning |
|-------|--------|
| **Open** | Milestone is published; contributors can apply. |
| **In Progress** | A contributor is assigned; work is ongoing. |
| **Submitted** | Contributor has submitted deliverable(s). |
| **Startup Verified** | Startup has verified the work. |
| **Admin Verified** | Admin has verified; ready for payment. |
| **Paid** | Payment has been released by admin. |

Transitions should be constrained (e.g. only startup can move to “Startup Verified”, only admin can move to “Admin Verified” and “Paid”).

---

### 8. Funding & Payments

- **Admin funds startups** upon approval (e.g. allocate a balance or “funding pool” per startup).
- **Funds are locked per milestone** (e.g. amount reserved when milestone is created or when contributor is assigned).
- **Payments release only after admin verification** (milestone in “Admin Verified” → admin triggers “Pay” → milestone moves to “Paid” and contributor is paid).
- **No automatic payouts** without admin action.

---

### 9. Admin Responsibilities

- Startup approval (e.g. approve/reject startup applications or profiles).
- Funding allocation (assign or top-up startup funding).
- Milestone verification (move to “Admin Verified” after checking).
- Payment release (move to “Paid”, trigger payout).
- Audit control (logs, history, reports).

---

### 10. Frontend Architecture

- **Navigation and routing** are controlled by `marketplace_role`:
  - **Startup:** Only startup-related routes (dashboard, profile, milestones, hiring, verification). No education, no governance, no marketplace browse.
  - **Contributor:** Existing platform + contributor routes (profile, browse startups, applications, deliverables, earnings).
- **Startup UI is isolated** (separate layout or route group if needed).
- **Contributor UI integrates** with the existing platform (same sidebar/layout with additional items).

---

### 11. Backend Architecture

- **Separate collections** (not only User):
  - **StartupProfile** – extended startup data (identity, funding state, etc.); linked to User.
  - **ContributorProfile** – skills, portfolio, payment info, earnings, availability; linked to User.
  - **Milestone** – per startup; lifecycle state; funding lock.
  - **Application** – contributor applies to milestone; one contributor per milestone.
- **REST APIs** with **strict authorization**: startup sees only own data; contributor sees own applications/deliverables/earnings; admin sees all as needed.

---

### 12. Minimal API Surface

High-level endpoints (expand as needed per phase):

| Area | Endpoints (minimal) |
|------|---------------------|
| **Auth / Signup** | Already: `POST /register`, `POST /activate-user`, `POST /login`. Optional: `POST /signup` alias or keep current. |
| **Startup profile** | `GET/PUT /startup-profile` (own), `GET /startup-profile/:id` (admin or public for browse). |
| **Contributor profile** | `GET/PUT /contributor-profile` (own). |
| **Milestone** | `GET/POST /milestone` (startup: own), `GET/PATCH /milestone/:id` (status transitions), admin endpoints for verify/list. |
| **Application** | `GET/POST /application` (e.g. `POST /milestone/:id/apply`), `GET/PATCH /application/:id`. |
| **Verify** | `PATCH /milestone/:id/verify` (startup: “Startup Verified”; admin: “Admin Verified”). |
| **Pay** | `POST /pay` or `PATCH /milestone/:id/pay` (admin only). |

---

### 13. Security & Access Control

- **Admin-only** for: funding allocation, milestone admin verification, payment release, startup approval (if applicable).
- **Startup and contributor access strictly isolated**: startups cannot see other startups’ data (except perhaps public browse); contributors see only own applications and earnings.
- **One contributor per milestone**: at most one accepted application per milestone; enforce in Application model and API.

---

### 14. Scalability Notes

- Profiles are **decoupled from User** (separate collections) so that schema growth is manageable.
- Design allows future integration for **escrow**, **DAO governance**, or **blockchain payouts** without changing core lifecycle or roles.

---

### 15. Summary (Spec)

A simple, low-complexity marketplace system with:

- **Clear identity:** `marketplace_role` (startup \| contributor) alongside existing roles.
- **Forced onboarding:** Complete startup or contributor profile before full access.
- **Isolated startup UI** and **integrated contributor UI**.
- **Milestone lifecycle:** Open → In Progress → Submitted → Startup Verified → Admin Verified → Paid.
- **Admin-controlled funding and payouts.**
- **Minimal API surface** and strict access control.

---

## Part B: 8-Phase Development Roadmap

Use these phases in order so that dependencies are respected and nothing is missed.

---

### Phase 1: Foundation (User + Registration) — DONE

**Goal:** Marketplace identity and signup path without changing existing roles.

**Deliverables:**

- [x] User schema: `marketplace_role` (`startup` \| `contributor`), optional `startupName`, `startupDescription`.
- [x] Registration API: accept `marketplace_role`; require it; for startup require `startupName`.
- [x] Registration UI: two options “Sign up as Startup” / “Sign up as Contributor”; startup-only fields (name, description) when Startup selected.
- [x] Activation (OTP/link) and login unchanged; single login; GET `/me` returns `marketplace_role` and startup fields.

**Exit criteria:** User can register as Startup or Contributor; data stored in User; login works; no other modules required yet.

---

### Phase 2: Profile Completion & Onboarding Gates

**Goal:** Enforce “access blocked until completion” for startups and contributors.

**Deliverables:**

- [ ] **Startup onboarding**
  - Define “startup profile complete” (e.g. StartupProfile exists and required fields filled, or keep only User.startupName for minimal).
  - Add flag e.g. `startupOnboardingComplete` (or derive from StartupProfile).
  - Middleware or guard: if `marketplace_role === 'startup'` and not complete → redirect to “Complete startup profile” page.
- [ ] **Contributor onboarding**
  - Define “contributor profile complete” (e.g. ContributorProfile exists and required fields).
  - Add flag e.g. `contributorOnboardingComplete`.
  - Guard: if `marketplace_role === 'contributor'` and not complete → redirect to “Complete contributor profile” page.
- [ ] **Routes**
  - `/onboarding/startup` – startup profile completion form (and API to save).
  - `/onboarding/contributor` – contributor profile completion form (and API to save).
- [ ] **Auth/guard**
  - After login, check marketplace_role and completion; redirect to correct onboarding or to dashboard.

**Exit criteria:** Incomplete startup/contributor cannot reach main app; must complete onboarding first.

**Dependencies:** Phase 1.

---

### Phase 3: Backend – StartupProfile & ContributorProfile

**Goal:** Separate collections for extended profile data; REST APIs; strict auth.

**Deliverables:**

- [ ] **Models**
  - **StartupProfile:** `userId` (ref User), company name, description, funding state, contact, status (e.g. pending/approved), timestamps. Optionally link to Milestones.
  - **ContributorProfile:** `userId` (ref User), skills (array), portfolio (links or text), payment info (e.g. payout method), earnings summary, availability, timestamps.
- [ ] **APIs**
  - `GET/PUT /api/v1/startup-profile` (own; create if not exists).
  - `GET /api/v1/startup-profile/:id` (admin or public for contributor “browse startups”).
  - `GET/PUT /api/v1/contributor-profile` (own).
- [ ] **Authorization**
  - Startup profile: only own (or admin). Contributor profile: only own (or admin).
- [ ] **Hooks**
  - On “complete” submit, set onboarding complete flag (Phase 2) and optionally create/update StartupProfile or ContributorProfile.

**Exit criteria:** Startups and contributors have persistent profiles; APIs are secure and used by onboarding flows.

**Dependencies:** Phase 2 (onboarding pages can call these APIs).

---

### Phase 4: Milestone & Application Models and APIs

**Goal:** Milestone lifecycle and one application per milestone; core CRUD and state transitions.

**Deliverables:**

- [ ] **Milestone model**
  - `startupId` (ref User or StartupProfile), title, description, amount (funding lock), status (enum: Open, In Progress, Submitted, Startup Verified, Admin Verified, Paid), dates, assignedContributorId (ref User or ContributorProfile).
- [ ] **Application model**
  - `milestoneId`, `contributorId`, status (e.g. pending, accepted, rejected), cover message, timestamps. Unique index on `(milestoneId, contributorId)`; business rule: at most one accepted application per milestone.
- [ ] **APIs**
  - `GET/POST /api/v1/milestone` (startup: own list + create).
  - `GET/PATCH /api/v1/milestone/:id` (startup: update status up to “Startup Verified”; admin: “Admin Verified”, “Paid”).
  - `GET/POST /api/v1/milestone/:id/application` (contributor: apply; startup: list applications, accept one).
  - `PATCH /api/v1/application/:id` (e.g. accept/reject by startup).
- [ ] **State machine**
  - Enforce valid transitions (e.g. Open → In Progress when application accepted; Submitted → Startup Verified by startup; Startup Verified → Admin Verified by admin; Admin Verified → Paid by admin).

**Exit criteria:** Startups can create milestones; contributors can apply; one contributor per milestone; status flow is clear and enforced.

**Dependencies:** Phase 3 (profiles exist; milestones belong to startup).

---

### Phase 5: Startup UI (Isolated)

**Goal:** Navigation and routing by `marketplace_role`; startup sees only startup hub (no education, governance, marketplace browse).

**Deliverables:**

- [ ] **Routing**
  - If `marketplace_role === 'startup'`: route to startup layout (e.g. `(startup)/dashboard`, `(startup)/profile`, `(startup)/milestones`, `(startup)/hiring`, `(startup)/verification`). No sidebar links to education/governance.
- [ ] **Layout**
  - Dedicated layout for startup: minimal nav (Dashboard, Profile, Milestones, Hiring, Verification). No Education Hub, Governance, etc.
- [ ] **Pages**
  - Dashboard: summary (milestones, applications, funding status).
  - Profile: view/edit startup profile (calls startup-profile API).
  - Milestones: list/create/edit milestones; show status.
  - Hiring: list applications per milestone; accept/reject.
  - Verification: list “Submitted” milestones; mark “Startup Verified”.
- [ ] **Guards**
  - All startup routes require `marketplace_role === 'startup'`; else redirect to main dashboard or onboarding.

**Exit criteria:** Startup users have a self-contained experience; no access to education/governance from startup UI.

**Dependencies:** Phase 3, 4 (APIs and data exist).

---

### Phase 6: Contributor UI (Integrated)

**Goal:** Contributor profile, browse startups, apply to milestones, submit deliverables, track earnings; integrated with existing platform.

**Deliverables:**

- [ ] **Navigation**
  - In existing dashboard/sidebar: add “Contributor” section when `marketplace_role === 'contributor'`: e.g. “My profile”, “Browse startups”, “My applications”, “Deliverables”, “Earnings”.
- [ ] **Pages**
  - Contributor profile: edit skills, portfolio, payment info, availability (contributor-profile API).
  - Browse startups: list approved startups (and their open milestones); public or minimal startup info.
  - Apply: from milestone detail, “Apply” button; submit application (message, etc.).
  - My applications: list applications with status; link to milestone.
  - Deliverables: for “In Progress” assignments, submit deliverable (upload or text); moves milestone to “Submitted” when done.
  - Earnings: summary of paid/pending earnings.
- [ ] **Chat (optional for minimal)**
  - Placeholder or simple messaging later; not required for Phase 6 minimal.

**Exit criteria:** Contributors can complete profile, browse startups, apply, submit deliverables, and see earnings within the existing app shell.

**Dependencies:** Phase 3, 4.

---

### Phase 7: Funding & Payments (Admin)

**Goal:** Admin funds startups; funds locked per milestone; payment release only after admin verification.

**Deliverables:**

- [ ] **Funding model**
  - Track “allocated funding” per startup (e.g. in StartupProfile or separate FundingBalance). Admin can “allocate” or “top up”.
- [ ] **Lock per milestone**
  - When milestone is created (or when contributor accepted), reserve/lock amount from startup’s balance (or mark milestone as funded). Prevent over-allocation.
- [ ] **Admin APIs**
  - `POST /api/v1/admin/fund-startup` (or PATCH startup funding balance).
  - `GET /api/v1/admin/startups` (list with funding status).
  - `PATCH /api/v1/milestone/:id/verify` (admin: set “Admin Verified”).
  - `POST /api/v1/pay` or `PATCH /api/v1/milestone/:id/pay` (admin only): mark “Paid”, record payout, update contributor earnings.
- [ ] **Audit**
  - Log funding allocations, verification actions, and payouts (who, when, amount, milestone).

**Exit criteria:** Admin can fund startups, milestones consume locked funds, and only admin can move to “Admin Verified” and “Paid”.

**Dependencies:** Phase 4 (milestones and applications).

---

### Phase 8: Admin UI & Polish

**Goal:** Admin can perform all responsibilities from the UI; security review and testing.

**Deliverables:**

- [ ] **Admin marketplace section**
  - Startup approval (if applicable): list pending startups; approve/reject.
  - Funding: list startups; allocate or top-up funding.
  - Milestones: list all or by startup; filter by status.
  - Verification: list “Startup Verified” milestones; mark “Admin Verified”.
  - Payments: list “Admin Verified” milestones; trigger “Pay”; confirm “Paid”.
- [ ] **Audit view**
  - Read-only list of funding, verification, and payment events (with who, when, amount).
- [ ] **Security**
  - Review: only admin can call fund/verify/pay; startup and contributor cannot.
  - One contributor per milestone enforced in API and DB.
- [ ] **Testing**
  - E2E: register as startup → complete profile → create milestone; register as contributor → complete profile → apply → deliver → startup verify → admin verify → admin pay.
- [ ] **Docs**
  - Update API docs and this spec with any final endpoint list and examples.

**Exit criteria:** Full flow works from admin UI; no missing permissions; audit trail in place.

**Dependencies:** Phases 1–7.

---

## Part C: Quick Reference

### Specification (Part A)

- **Identity:** `marketplace_role` (startup \| contributor); existing roles unchanged.
- **Onboarding:** Mandatory profile completion; access blocked until done.
- **Startup:** Isolated UI; profiles, milestones, hiring, verification; no education/governance.
- **Contributor:** Integrated UI; profile, browse, apply, deliver, earnings.
- **Lifecycle:** Open → In Progress → Submitted → Startup Verified → Admin Verified → Paid.
- **Funding:** Admin allocates; locked per milestone; payouts only after admin verification.
- **APIs:** startup-profile, contributor-profile, milestone, application, verify, pay (minimal surface).
- **Security:** Admin-only for money and verification; one contributor per milestone.

### Phases (Part B) – Order

| Phase | Focus | Status |
|-------|--------|--------|
| 1 | Foundation (User + registration + marketplace_role + startup fields) | Done |
| 2 | Profile completion & onboarding gates | Todo |
| 3 | StartupProfile & ContributorProfile (models + APIs) | Todo |
| 4 | Milestone & Application (models + APIs + lifecycle) | Todo |
| 5 | Startup UI (isolated) | Todo |
| 6 | Contributor UI (integrated) | Todo |
| 7 | Funding & payments (admin backend) | Todo |
| 8 | Admin UI & polish | Todo |

Use this document as the single reference for the marketplace module and the 8-phase development plan.
