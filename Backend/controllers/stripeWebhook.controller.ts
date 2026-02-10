/**
 * Phase 7: Stripe Webhooks – handle async events.
 * Raw body required for signature verification – mount before express.json().
 */
import { Request, Response } from 'express';
import Stripe from 'stripe';
import UserModel from '../models/user.mode';
import OrderModel from '../models/order.model';
import { CourseModel } from '../models/course.model';
import WithdrawalModel from '../models/withdrawal.model';
import logger from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  if (!webhookSecret?.startsWith('whsec_')) {
    logger.warn('Stripe webhook: STRIPE_WEBHOOK_SECRET not configured');
    res.status(500).json({ error: 'Webhook not configured' });
    return;
  }

  const sig = req.headers['stripe-signature'];
  if (!sig || typeof sig !== 'string') {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  let event: Stripe.Event;
  const rawBody = req.body;
  const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : (typeof rawBody === 'string' ? Buffer.from(rawBody) : null);
  if (!bodyBuffer) {
    res.status(400).json({ error: 'Invalid webhook body' });
    return;
  }

  try {
    event = stripe.webhooks.constructEvent(bodyBuffer, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.warn('Stripe webhook signature verification failed:', message);
    res.status(400).json({ error: `Webhook Error: ${message}` });
    return;
  }

  try {
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        await UserModel.updateOne(
          { stripeConnectAccountId: account.id },
          {
            $set: {
              stripeConnectStatus:
                account.charges_enabled && account.payouts_enabled ? 'active' : 'pending',
            },
          }
        );
        logger.info(`Webhook account.updated: ${account.id} (charges: ${account.charges_enabled}, payouts: ${account.payouts_enabled})`);
        break;
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const existing = await OrderModel.findOne({ stripePaymentIntentId: pi.id });
        if (existing) {
          logger.info(`Webhook payment_intent.succeeded: Order already exists for ${pi.id}`);
          break;
        }

        const { courseId, userId, courseName, equalUsdToUse } = pi.metadata || {};
        if (!courseId || !userId) {
          logger.warn(`Webhook payment_intent.succeeded: Missing metadata for ${pi.id}`);
          break;
        }

        const course = await CourseModel.findById(courseId).populate('createdBy', 'firstName lastName');
        if (!course) {
          logger.warn(`Webhook payment_intent.succeeded: Course ${courseId} not found`);
          break;
        }

        const equalUsdUsed = Math.floor(Number(equalUsdToUse) || 0);
        const amountPaid = (pi.amount ?? 0) / 100;
        const instructor = course.createdBy as { _id: { toString: () => string }; firstName?: string; lastName?: string };
        await OrderModel.create({
          courseId,
          userId,
          courseName: courseName || course.name,
          coursePrice: course.price,
          courseThumbnail: course.thumbnail,
          instructorId: instructor._id.toString(),
          instructorName: `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim(),
          status: 'completed',
          payment_info: {
            paymentMethod: equalUsdUsed > 0 ? 'stripe+equalusd' : 'stripe',
            paymentStatus: 'completed',
            transactionId: pi.id,
            amount: amountPaid,
            currency: 'USD',
          },
          stripePaymentIntentId: pi.id,
          ...(equalUsdUsed > 0 && { equalUsdUsed }),
          enrolledAt: new Date(),
          completedAt: new Date(),
        });

        logger.info(`Webhook payment_intent.succeeded: Created Order for course ${courseId}, user ${userId}`);
        break;
      }

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer;
        logger.info(`Webhook transfer.created: ${transfer.id} amount=${transfer.amount} dest=${transfer.destination}`);
        break;
      }

      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;
        await WithdrawalModel.updateOne(
          { stripePayoutId: payout.id },
          { $set: { status: 'paid' } }
        );
        logger.info(`Webhook payout.paid: ${payout.id}`);
        break;
      }

      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout;
        await WithdrawalModel.updateOne(
          { stripePayoutId: payout.id },
          { $set: { status: 'failed' } }
        );
        logger.warn(`Webhook payout.failed: ${payout.id}`);
        break;
      }

      case 'payout.canceled': {
        const payout = event.data.object as Stripe.Payout;
        await WithdrawalModel.updateOne(
          { stripePayoutId: payout.id },
          { $set: { status: 'canceled' } }
        );
        logger.info(`Webhook payout.canceled: ${payout.id}`);
        break;
      }

      default:
        logger.debug(`Webhook unhandled event: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error('Stripe webhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}
