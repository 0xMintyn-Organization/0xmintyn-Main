# Deep Analysis & 8-Phase Stripe Integration Plan

## Part 1: Complete Project Analysis

### 1.1 User Roles & Money Flows

| Role | Source | Receives From | Sends To |
|------|--------|---------------|----------|
| **Student** | User | - | Course purchase → Instructor |
| **Instructor** | User, role=instructor | 95% of course sales | - |
| **Admin** | User, role=admin | 5% platform fee | Milestone funding → Startup |
| **Startup** | User, marketplace_role=startup | Milestone funding from Admin | Salary → Contributor |
| **Contributor** | User, marketplace_role=contributor | Salary from Startup | - |
| **Platform** | - | 5% course fee | Milestone funding (treasury) |

---

### 1.2 Current Payment-Related Data (What Exists)

#### User Model (`Backend/models/user.mode.ts`)
| Field | Purpose |
|-------|---------|
| `role` | user, instructor, admin, influencer |
| `marketplace_role` | startup, contributor, user |
| `solanaWallet` | Base58 pubkey for on-chain milestone (optional) |
| **Missing** | `stripeConnectAccountId` – not present |

#### StartupProfile Model (`Backend/models/startupProfile.model.ts`)
| Field | Current State | Issue |
|-------|---------------|-------|
| `paymentMethod.methodType` | card \| paypal \| bank \| crypto \| '' | Manual entry only |
| `paymentMethod.cardLast4` | Last 4 digits | Display only, no real payment |
| `paymentMethod.cardExpiry` | MM/YY | Not PCI compliant if used for payment |
| `paymentMethod.bankName`, `accountLast4`, `routing` | Manual entry | No Stripe tokenization |
| `paymentMethod.paypalEmail` | Email | No PayPal API integration |
| `paymentMethod.cryptoAddress` | Wallet address | Not used for fiat payouts |
| **Missing** | `stripeConnectAccountId` | Needed for receiving milestone funding |

#### ContributorProfile Model (`Backend/models/contributorProfile.model.ts`)
| Field | Same as StartupProfile | **Missing** | `stripeConnectAccountId` |

#### Instructor (Course `createdBy` = User)
- No separate Instructor model – User with `role=instructor`
- **Missing**: `stripeConnectAccountId` on User for instructors

#### Order Model (`Backend/models/order.model.ts`)
| Field | Current | Needed |
|-------|---------|--------|
| `status` | pending, completed, cancelled, refunded | OK |
| `payment_info` | paymentId, paymentMethod, amount, etc. | Add `stripePaymentIntentId`, `stripeChargeId` |
| **Current flow** | `free_enrollment` – no real payment | Replace with Stripe PaymentIntent |

#### MilestonePayment Model
| Field | Current | Needed |
|-------|---------|--------|
| `payment_info.paymentMethod` | 'manual' | Add `stripeTransferId` |
| **Current** | Record only, no Stripe | Add Transfer on Admin approve |

#### ContributorPayout Model
| Field | Current | Needed |
|-------|---------|--------|
| `status` | pending, paid | Add `stripeTransferId` when paid via Stripe |
| **Current** | Manual record only | Add Reverse Transfer + Transfer flow |

---

### 1.3 Frontend Components – Payment UI

| Component | Location | Current Behavior |
|-----------|----------|------------------|
| **PaymentMethodSection** | `Frontend/src/components/marketplace/PaymentMethodSection.tsx` | Manual form: card (last4, expiry), paypal (email), bank, crypto. Data saved to StartupProfile/ContributorProfile. **No Stripe Elements. Not PCI compliant for card entry.** |
| **Used in** | `startup/profile`, `contributor-profile` | Same manual flow |
| **Course enroll** | `educationhub/[courseId]` | POST enroll – no payment step, Order created with `free_enrollment` |
| **Admin funding** | `admin/funding` | PATCH milestone status=Paid – backend creates MilestonePayment record, no Stripe |
| **Contributor payout** | Via `contributorPayout.create` | Record only, no Stripe |

---

### 1.4 Backend Routes – Payment Touch Points

| Route | Controller | Current | Stripe Action Needed |
|-------|------------|---------|----------------------|
| POST `/enrollment/enroll/:courseId` | enrollment.controller | Creates Order, free | Create PaymentIntent, 95% to instructor, 5% platform |
| PATCH `/milestone/:id` (status=Paid) | milestone.controller | Creates MilestonePayment | Create Transfer to Startup Connect |
| POST `/contributor-payout` | contributorPayout.controller | Creates record | Reverse Transfer from Startup, Transfer to Contributor |
| PUT `/startup-profile` | startupProfile.controller | Saves paymentMethod | **Replace with** Connect onboarding (Account Links) |
| PUT `/contributor-profile` | contributorProfile.controller | Saves paymentMethod | **Replace with** Connect onboarding |

---

### 1.5 Data Flow Summary – Current vs Target

#### Course Purchase (Current)
```
Student clicks Enroll → POST enroll → Order created (free) → No money moves
```

#### Course Purchase (Target)
```
Student clicks Buy ($100) → Create PaymentIntent (destination=instructor, application_fee=5%) 
  → Student pays → $95 to Instructor Connect, $5 to Platform
```

#### Milestone (Current)
```
Admin approves → MilestonePayment record created → No money moves
```

#### Milestone (Target)
```
Admin approves → Transfer from Platform to Startup Connect → Startup receives funds
```

#### Contributor Salary (Current)
```
Startup clicks "Pay contributor" → ContributorPayout record → No money moves
```

#### Contributor Salary (Target)
```
Startup clicks "Pay contributor" → Reverse Transfer from Startup Connect 
  → Transfer to Contributor Connect → Contributor receives funds
```

#### Withdraw (Current)
```
Does not exist
```

#### Withdraw (Target)
```
Instructor/Contributor clicks Withdraw → Fetch balance → Create Payout → Money to bank
```

---

### 1.6 What Must Be Added (Schema & Services)

| Where | Add |
|-------|-----|
| **User** | `stripeConnectAccountId?: string` (for instructor, startup, contributor – one user can have multiple roles, one Connect account per user is OK) |
| **Order** | `stripePaymentIntentId?: string`, `stripeChargeId?: string` |
| **MilestonePayment** | `stripeTransferId?: string` |
| **ContributorPayout** | `stripeTransferId?: string` |
| **New Model** | `StripeConnectAccount` or store on User – `stripeConnectAccountId`, `stripeAccountStatus` (pending, active) |
| **New Model** | `Withdrawal` – userId, amount, stripePayoutId, status, createdAt |
| **New Service** | `Backend/services/stripeConnect.service.ts` – create account, account links, transfers, payouts |
| **New Service** | `Backend/services/stripePayment.service.ts` – PaymentIntent for courses |
| **Env** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_PLATFORM_FEE_PERCENT=5` |

---

## Part 2: 8-Phase Implementation Plan

---

### Phase 1: Stripe Backend Setup & Connect Account Creation ✅ DONE

**Goal**: Platform can create Stripe Connect Express accounts and onboard users.

**Tasks**:
1. Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` to `.env`
2. Create `Backend/services/stripeConnect.service.ts`:
   - `createConnectAccount(userId, email, userType: 'instructor'|'startup'|'contributor')` → returns `accountId`
   - `createAccountLink(accountId, refreshUrl, returnUrl)` → returns onboarding URL
   - `getAccountStatus(accountId)` → charges_enabled, payouts_enabled
3. Add `stripeConnectAccountId` and `stripeConnectStatus` to User model
4. Create routes:
   - `POST /api/v1/stripe/connect/create-account` – creates Connect account, stores on User
   - `GET /api/v1/stripe/connect/onboarding-link` – returns URL for user to complete onboarding
   - `GET /api/v1/stripe/connect/status` – returns account status (charges_enabled, etc.)
5. Migrate existing users: no auto-migration; new onboarding flow

**Deliverable**: Instructor/Startup/Contributor can click "Connect bank account" and complete Stripe Express onboarding. `stripeConnectAccountId` saved on User.

---

### Phase 2: Replace PaymentMethodSection with Stripe Connect Onboarding

**Goal**: Remove manual card/bank entry; use Stripe Connect for receiving money.

**Tasks**:
1. Create `StripeConnectOnboarding` component:
   - If no `stripeConnectAccountId` → show "Connect bank account" button
   - On click → call backend for Account Link → redirect to Stripe
   - On return → show "Connected" with last4 from Stripe (optional)
2. Update `startup/profile` page: Replace `PaymentMethodSection` for "receive payments" with `StripeConnectOnboarding`
3. Update `contributor-profile` page: Same replacement
4. Keep `PaymentMethodSection` only for display of "how you'll get paid" (optional) or remove
5. Create `StripeConnectOnboarding` for Instructor – new section in instructor dashboard/profile or course creation flow

**Deliverable**: Startup, Contributor, Instructor connect via Stripe – no manual card/bank entry for receiving money.

---

### Phase 3: Course Purchase with Stripe (95% Instructor, 5% Platform)

**Goal**: Student pays for course; 95% to instructor, 5% to platform.

**Tasks**:
1. Create `Backend/services/stripePayment.service.ts`:
   - `createCoursePaymentIntent(courseId, userId, amount, instructorConnectAccountId)` → PaymentIntent with `transfer_data.destination`, `application_fee_amount` (5%)
2. Add `stripePaymentIntentId` to Order model
3. New flow in enrollment:
   - If course.price > 0: require PaymentIntent before enrollment
   - `POST /api/v1/enrollment/create-payment-intent/:courseId` – creates PaymentIntent, returns clientSecret
   - Frontend: use Stripe Elements or Checkout to collect payment
   - On success: `POST /api/v1/enrollment/confirm-enroll/:courseId` with `paymentIntentId` – verify payment, create Order, enroll
4. If course.price === 0: keep current free enrollment
5. Instructor must have `stripeConnectAccountId` and `charges_enabled` to sell paid courses

**Deliverable**: Student pays for course; money splits 95/5 automatically.

---

### Phase 4: Admin → Startup Milestone Transfer

**Goal**: When Admin marks milestone Paid, Platform transfers funds to Startup's Connect account.

**Tasks**:
1. Add `stripeTransferId` to MilestonePayment model
2. In `milestone.controller` PATCH (status=Paid):
   - Get Startup user's `stripeConnectAccountId`
   - If missing → return error "Startup must connect bank account first"
   - Call `stripe.transfers.create({ amount, currency, destination: connectAccountId })`
   - Store `stripeTransferId` in MilestonePayment
3. Platform balance: Admin must ensure platform has funds (top-up via Stripe Dashboard or separate admin flow)
4. Handle failure: if Transfer fails, do not set milestone status to Paid; return error

**Deliverable**: Admin approves → real money to Startup.

---

### Phase 5: Startup → Contributor Salary (Reverse Transfer + Transfer) ✅ DONE

**Goal**: Startup pays contributor; funds move from Startup's Connect balance to Contributor's Connect.

**Tasks**:
1. Add `stripeTransferId` to ContributorPayout model
2. In `contributorPayout.controller` create:
   - Get Startup's and Contributor's `stripeConnectAccountId`
   - Verify both have active Connect accounts
   - Create **Reverse Transfer** from Startup for `amount` (pulls from Startup's balance to platform)
   - Create **Transfer** to Contributor for `amount`
   - Store `stripeTransferId` on ContributorPayout
3. Validate: Startup must have sufficient balance (fetch balance first)
4. Link to Engagement: Contributor must be hired (application accepted)

**Deliverable**: Startup pays contributor → real money to Contributor.

---

### Phase 6: Withdraw Balance & Payout ✅ DONE

**Goal**: Instructor/Contributor can withdraw available balance to their bank.

**Tasks**:
1. Create `Withdrawal` model: userId, amount, stripePayoutId, status (pending, paid, failed), createdAt
2. Create `Backend/services/stripePayout.service.ts`:
   - `getConnectBalance(accountId)` → available, pending
   - `createPayout(accountId, amount, currency)` → Payout
3. Create routes:
   - `GET /api/v1/stripe/balance` – returns available/pending for current user
   - `POST /api/v1/stripe/withdraw` – body: { amount } – creates Payout
   - `GET /api/v1/stripe/withdrawals` – list user's withdrawals
4. Frontend: Withdraw page – show balance, input amount, "Withdraw" button, withdrawal history

**Deliverable**: Instructor/Contributor can withdraw to bank.

---

### Phase 7: Webhooks & Robustness ✅ DONE

**Goal**: Handle async Stripe events; idempotency; error recovery.

**Tasks**:
1. Create `POST /api/v1/stripe/webhook` – raw body, verify signature
2. Handle events:
   - `account.updated` – sync charges_enabled, payouts_enabled to User
   - `payment_intent.succeeded` – ensure Order created (idempotent)
   - `transfer.created` – optional logging
   - `payout.paid`, `payout.failed` – update Withdrawal status
3. Idempotency: use `paymentIntentId` / `transferId` to avoid duplicate Orders/Transfers
4. Admin: view failed transfers, retry logic (manual or automated)

**Deliverable**: System handles Stripe events reliably.

---

### Phase 8: Frontend Polish & Admin Tools ✅ DONE

**Goal**: UX for all flows; admin visibility.

**Tasks**:
1. **Course purchase**: Stripe Elements or Stripe Checkout on course page; loading states; success/error
2. **Stripe Connect**: Clear onboarding CTA; "Connected" badge; re-onboard if expired
3. **Milestone**: Admin sees "Transfer to Startup" – show Connect status; error if not connected
4. **Contributor payout**: Startup sees "Pay" – validate balance; show success
5. **Withdraw**: Instructor/Contributor earnings page – balance, withdraw button, history
6. **Admin dashboard**: Platform balance, recent transfers, failed payouts
7. **Environment**: Stripe keys in .env; webhook endpoint config in Stripe Dashboard

**Deliverable**: Complete, production-ready Stripe integration.

---

## Part 3: File-Level Checklist

### Backend – New Files
- `services/stripeConnect.service.ts`
- `services/stripePayment.service.ts`
- `services/stripePayout.service.ts`
- `controllers/stripe.controller.ts`
- `routes/stripe.route.ts`
- `models/withdrawal.model.ts`

### Backend – Modified Files
- `models/user.mode.ts` – add stripeConnectAccountId, stripeConnectStatus
- `models/order.model.ts` – add stripePaymentIntentId, stripeChargeId
- `models/milestonePayment.model.ts` – add stripeTransferId
- `models/contributorPayout.model.ts` – add stripeTransferId
- `controllers/enrollment.controller.ts` – payment flow
- `controllers/milestone.controller.ts` – Transfer on Paid
- `controllers/contributorPayout.controller.ts` – Reverse+Transfer
- `app.ts` – mount stripe routes, webhook (raw body)

### Frontend – New Components
- `StripeConnectOnboarding.tsx`
- `CoursePaymentCheckout.tsx` (or use Stripe Checkout)
- `WithdrawSection.tsx`

### Frontend – Modified Pages
- `startup/profile` – Stripe Connect instead of PaymentMethodSection
- `contributor-profile` – same
- `educationhub/[courseId]` – payment step before enroll
- `instructor/earnings` – balance, withdraw
- `admin/funding` – show Connect status, transfer feedback

---

## Part 4: Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CONNECT_PLATFORM_FEE_PERCENT=5
```

---

## Part 5: Execution Order

1. **Phase 1** – Foundation (Connect accounts)
2. **Phase 2** – Replace manual payment UI
3. **Phase 3** – Course payments (independent)
4. **Phase 4** – Milestone transfers (needs platform balance)
5. **Phase 5** – Contributor payouts (needs Phase 4)
6. **Phase 6** – Withdraw (needs Phase 2)
7. **Phase 7** – Webhooks (parallel with 3–6)
8. **Phase 8** – Polish

---

*Document created for EqualMint/0xmintyn – Stripe Connect Integration*
