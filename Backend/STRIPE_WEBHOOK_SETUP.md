# Stripe Webhook Setup (Phase 7)

## Local development (localhost)

**Webhook URL for local:** `https://api.equalmint.com/api/v1/stripe/webhook`

1. Start your backend: `npm run dev` (or `node server.ts`)
2. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
3. Run: `stripe listen --forward-to localhost:8000/api/v1/stripe/webhook`
4. Copy the `whsec_...` from the CLI output and add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```
5. Restart your backend

---

## Production: Create webhook in Stripe Dashboard

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. **Endpoint URL**: `https://your-api-domain.com/api/v1/stripe/webhook`
4. **Events to send** – select:
   - `account.updated` (Connect accounts)
   - `payment_intent.succeeded`
   - `transfer.created`
   - `payout.paid`
   - `payout.failed`
   - `payout.canceled`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`) and add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

---

## Events handled

| Event | Action |
|-------|--------|
| `account.updated` | Sync charges_enabled, payouts_enabled to User stripeConnectStatus |
| `payment_intent.succeeded` | Create Order if not exists (idempotent) |
| `transfer.created` | Log (optional) |
| `payout.paid` | Update Withdrawal status to paid |
| `payout.failed` | Update Withdrawal status to failed |
| `payout.canceled` | Update Withdrawal status to canceled |
