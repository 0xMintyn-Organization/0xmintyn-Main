/**
 * Add funds to platform Stripe balance (test mode only).
 * Uses test card 4000000000000077 which sends funds directly to available balance.
 *
 * Run: node scripts/stripe-topup-balance.js [amount]
 * Example: node scripts/stripe-topup-balance.js 100
 * (Adds $100 to platform balance. Default: $50)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Stripe = require('stripe');

const sk = process.env.STRIPE_SECRET_KEY;
if (!sk) {
  console.error('❌ STRIPE_SECRET_KEY not set');
  process.exit(1);
}
if (!sk.startsWith('sk_test_')) {
  console.error('❌ Use TEST keys only. This script is for test mode.');
  process.exit(1);
}

const amountUsd = parseFloat(process.argv[2]) || 50;
const amountCents = Math.round(amountUsd * 100);

const stripe = new Stripe(sk);

async function main() {
  console.log(`\n💰 Adding $${amountUsd} to platform available balance (test mode)...\n`);

  try {
    // Use pm_card_bypassPending (equivalent to 4000000000000077) - funds go to available balance immediately
    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      description: 'Test top-up for platform balance (milestone transfers)',
      payment_method: 'pm_card_bypassPending',
      confirm: true,
      payment_method_types: ['card'],
    });

    console.log('✅ Success!');
    console.log('   PaymentIntent ID:', pi.id);
    console.log('   Amount: $' + (pi.amount / 100).toFixed(2));
    console.log('\n   Funds are now in your available balance.');
    console.log('   You can approve milestone transfers in Admin → Funding.\n');
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

main();
