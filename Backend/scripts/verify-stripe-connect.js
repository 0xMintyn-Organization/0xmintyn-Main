/**
 * Verify Stripe keys and Connect status.
 * Run: node scripts/verify-stripe-connect.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Stripe = require('stripe');

const sk = process.env.STRIPE_SECRET_KEY;
if (!sk) {
  console.error('❌ STRIPE_SECRET_KEY not set in .env');
  process.exit(1);
}

const stripe = new Stripe(sk);

async function main() {
  console.log('🔍 Verifying Stripe setup...\n');

  // 1. Which account?
  try {
    const balance = await stripe.balance.retrieve();
    const accountId = sk.includes('_') ? sk.split('_')[2]?.substring(0, 18) : 'unknown';
    console.log('✅ Secret key is valid');
    console.log('   Account segment:', accountId || '(from key)');
    console.log('   Balance (available):', balance.available?.[0] ? `${(balance.available[0].amount / 100).toFixed(2)} ${balance.available[0].currency}` : 'none');
  } catch (e) {
    console.error('❌ Invalid secret key:', e.message);
    process.exit(1);
  }

  // 2. Try creating a Connect account
  console.log('\n🔄 Attempting to create Connect Express account...');
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: 'test-verify@example.com',
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      business_type: 'individual',
    });
    console.log('✅ Connect account created:', account.id);
    console.log('   → Connect IS enabled for this account.');
    // Clean up test account
    await stripe.accounts.del(account.id);
    console.log('   (Test account deleted)');
  } catch (e) {
    console.error('❌ Connect account creation failed:', e.message);
    if (e.message?.includes('signed up for Connect')) {
      console.log('\n📋 To fix: Complete Stripe Connect platform onboarding:');
      console.log('   1. Go to https://dashboard.stripe.com/connect/accounts/overview');
      console.log('   2. Sign in with the SAME account as your API keys');
      console.log('   3. Click "Get started" or "Complete setup" if shown');
      console.log('   4. Choose "Marketplace" as business model');
      console.log('   5. Accept terms and finish any required steps');
    }
    process.exit(1);
  }

  console.log('\n✅ Stripe Connect is properly configured.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
