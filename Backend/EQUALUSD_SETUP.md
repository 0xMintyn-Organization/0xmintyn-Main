# EqualUSD – Platform Points

1 EqualUSD = $1 USD. Platform points for registration bonus, course completion, proposal approval, and course purchase discounts.

## How it works

| Action | EqualUSD |
|--------|----------|
| **Registration** | New users get bonus on signup |
| **Course completion** | User earns when they complete all lectures |
| **Proposal approved** | Proposer earns when admin marks proposal as Passed |
| **Course purchase** | User can spend EqualUSD as discount (remaining paid via Stripe) |

## Environment variables (optional)

Add to `.env` to customize amounts. Defaults: 10, 20, 20.

```
EQUALUSD_REGISTRATION_BONUS=10
EQUALUSD_COURSE_COMPLETION=20
EQUALUSD_PROPOSAL_APPROVED=20
```

## API

- `GET /api/v1/equalusd/balance` – Current user's balance (authenticated)
- `GET /api/v1/equalusd/transactions?page=1&limit=20` – Transaction history (authenticated)

## Course purchase with EqualUSD

**Create Payment Intent** – Include `equalUsdToUse` in body:
```json
POST /api/v1/enrollment/create-payment-intent/:courseId
{ "equalUsdToUse": 5 }
```
Response includes `equalUsdApplied`, `amountDue` (Stripe amount after discount).

**Confirm enroll** – Same as before; EqualUSD is debited automatically using metadata from PaymentIntent.
