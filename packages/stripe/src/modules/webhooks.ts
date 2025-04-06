import Stripe from "stripe";
import { initStripe, StripeOptions } from "../utils";

/**
 * Verifies the Stripe webhook signature and constructs the event object.
 * THIS SHOULD BE USED IN YOUR BACKEND (e.g., API route, serverless function).
 *
 * @param args Object containing stripe client/options, request body, signature, and secret.
 * @param args.stripe - Initialized Stripe client instance or StripeOptions.
 * @param args.body - The raw request body (as Buffer or string).
 * @param args.signature - The value of the 'Stripe-Signature' header from the request.
 * @param args.secret - Your Stripe webhook signing secret.
 * @returns A promise that resolves to the verified Stripe.Event object.
 * @throws An error if the signature verification fails or the payload parsing fails.
 * @example
 * // In a Next.js API route (ensure body-parser is disabled for this route)
 * import { buffer } from 'micro';
 *
 * export const config = { api: { bodyParser: false } };
 *
 * async function handler(req, res) {
 *   if (req.method === 'POST') {
 *     const stripeOptions = { apiKey: process.env.STRIPE_SECRET_KEY! };
 *     const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
 *     const signature = req.headers['stripe-signature']!;
 *     const body = await buffer(req);
 *
 *     let event;
 *     try {
 *       event = await constructWebhookEvent({ stripe: stripeOptions, body, signature, secret: webhookSecret });
 *       // ... handle event ...
 *       res.status(200).json({ received: true });
 *     } catch (err) {
 *       console.error(`Webhook signature verification failed: ${err.message}`);
 *       return res.status(400).send(`Webhook Error: ${err.message}`);
 *     }
 *   }
 * }
 */
export const constructWebhookEvent = async ({
  stripe,
  body,
  signature,
  secret,
}: {
  stripe: Stripe | StripeOptions;
  body: Buffer | string;
  signature: string | string[];
  secret: string;
}): Promise<Stripe.Event> => {
  const stripeClient = stripe instanceof Stripe ? stripe : initStripe(stripe);

  if (!signature) {
    throw new Error("Missing 'Stripe-Signature' header.");
  }
  if (!secret) {
    throw new Error("Webhook signing secret is missing.");
  }

  try {
    // The signature might be an array if headers are duplicated, use the first one
    const sig = Array.isArray(signature) ? signature[0] : signature;
    if (!sig) {
      throw new Error("'Stripe-Signature' header value is invalid.");
    }
    const event = stripeClient.webhooks.constructEvent(body, sig, secret);
    return event;
  } catch (err: any) {
    // On error, log and re-throw for the caller to handle
    console.error(`Error constructing webhook event: ${err.message}`);
    throw new Error(`Webhook Error: ${err.message}`);
  }
};

/**
 * Type definition for a map of webhook event handlers.
 * Keys are Stripe event types (e.g., 'checkout.session.completed')
 * Values are functions that take the Stripe.Event object and perform actions.
 */
export type StripeWebhookHandlerMap = {
  [EventType in Stripe.Event["type"]]?: (
    event: Extract<Stripe.Event, { type: EventType }>,
  ) => Promise<void> | void;
} & {
  // Optional generic handler for all events or specific non-typed events
  "*"?: (event: Stripe.Event) => Promise<void> | void;
};

/**
 * Dispatches a verified Stripe event to the appropriate handler function.
 *
 * @param args Object containing the verified event and the handlers map.
 * @param args.event - The verified Stripe.Event object (returned from constructWebhookEvent).
 * @param args.handlers - A map where keys are event types and values are handler functions.
 * @returns A promise that resolves when the handler (if found) completes.
 * @example
 * const handlers: StripeWebhookHandlerMap = {
 *   'checkout.session.completed': async (event) => { ... },
 *   'customer.subscription.updated': async (event) => { ... },
 * };
 *
 * try {
 *   const event = await constructWebhookEvent({ ... });
 *   await handleWebhookEvent({ event, handlers });
 *   res.status(200).json({ received: true });
 * } catch (err) {
 *   // Handle error
 * }
 */
export const handleWebhookEvent = async ({
  event,
  handlers,
}: {
  event: Stripe.Event;
  handlers: StripeWebhookHandlerMap;
}): Promise<void> => {
  const handler = handlers[event.type as Stripe.Event["type"]];
  const wildcardHandler = handlers["*"];

  let handled = false;
  if (handler) {
    try {
      // Avoid overly complex casting; the map definition ensures correct type
      // The specific handler receives the event typed correctly based on the map key
      await handler(event as any);
      handled = true;
    } catch (error: any) {
      console.error(`Error in webhook handler for ${event.type}:`, error);
      // Optional: Re-throw or handle specific errors if needed
      throw new Error(`Handler for ${event.type} failed: ${error.message}`);
    }
  }

  // Run wildcard handler if present and specific handler didn't run or doesn't exist
  // Or adjust logic if you want wildcard to always run
  if (wildcardHandler && !handled) {
    try {
      await wildcardHandler(event);
    } catch (error: any) {
      console.error(
        `Error in wildcard webhook handler for ${event.type}:`,
        error,
      );
      throw new Error(`Wildcard handler failed: ${error.message}`);
    }
  }

  if (!handler && !wildcardHandler) {
    console.warn(`No handler found for webhook event type: ${event.type}`);
    // No error thrown, just a warning
  }
};
