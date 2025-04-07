import { Hono } from "hono";
import { stripe } from "@/lib/stripe/config";
import logger from "@/utils/logger";
import Stripe from "stripe";

const webhooks = new Hono();

const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  // Add other events you need to handle
]);

webhooks.post("/stripe", async (c) => {
  const signature = c.req.header("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    logger.warn("Stripe webhook received without signature.");
    return c.json({ error: "Missing stripe-signature header" }, 400);
  }

  if (!webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET is not set.");
    return c.json({ error: "Webhook secret not configured" }, 500);
  }

  let event: Stripe.Event;

  try {
    // Hono v4 provides req.text() for the raw body
    const rawBody = await c.req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    logger.info(`Stripe webhook received: ${event.type} (${event.id})`);
  } catch (err: any) {
    logger.error(
      `Stripe webhook signature verification failed: ${err.message}`,
    );
    return c.json({ error: `Webhook Error: ${err.message}` }, 400);
  }

  // Handle the event
  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case "checkout.session.completed":
          // Handle successful checkout
          const session = event.data.object as Stripe.Checkout.Session;
          logger.info(`Checkout session ${session.id} completed.`);
          // TODO: Fulfill the purchase (e.g., grant access, update DB)
          break;
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
        case "customer.subscription.created":
          // Handle subscription changes
          const subscription = event.data.object as Stripe.Subscription;
          logger.info(`Subscription ${subscription.id} ${event.type}.`);
          // TODO: Update subscription status in DB
          break;
        case "invoice.paid":
          // Handle successful payment
          const invoicePaid = event.data.object as Stripe.Invoice;
          logger.info(`Invoice ${invoicePaid.id} paid successfully.`);
          // TODO: Update billing status, maybe grant access if renewal
          break;
        case "invoice.payment_failed":
          // Handle failed payment
          const invoiceFailed = event.data.object as Stripe.Invoice;
          logger.warn(`Invoice ${invoiceFailed.id} payment failed.`);
          // TODO: Notify user, potentially restrict access
          break;
        default:
          logger.warn(`Unhandled relevant event type: ${event.type}`);
      }
      // TODO: Consider asynchronous processing for DB updates (e.g., BullMQ)
    } catch (error: any) {
      logger.error(
        `Error handling Stripe event ${event.type} (${event.id}): ${error.message}`,
        { stack: error.stack },
      );
      // Still return 200 to Stripe, but log the internal error
      return c.json({
        received: true,
        error: "Internal server error occurred",
      });
    }
  }

  // Acknowledge receipt of the event to Stripe
  return c.json({ received: true });
});

export default webhooks;
