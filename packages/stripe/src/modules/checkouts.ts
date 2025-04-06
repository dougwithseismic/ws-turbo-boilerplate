import Stripe from "stripe";
import { initStripe, StripeOptions } from "../utils"; // Import shared utility

/**
 * Creates a new Stripe Checkout Session.
 * @param args Object containing stripe client/options and session parameters.
 * @param args.stripe - Initialized Stripe client instance or StripeOptions.
 * @param args.params - Parameters for creating the session. See Stripe.Checkout.SessionCreateParams.
 *                 Requires line_items, mode, success_url, cancel_url.
 * @param args.options - Optional Stripe request options.
 * @returns A promise that resolves to the newly created Stripe.Checkout.Session.
 * @example
 * const stripe = initStripe({ apiKey: 'sk_test_...' });
 * const sessionParams = {
 *   payment_method_types: ['card'],
 *   line_items: [{
 *     price_data: {
 *       currency: 'usd',
 *       product_data: { name: 'T-shirt' },
 *       unit_amount: 2000,
 *     },
 *     quantity: 1,
 *   }],
 *   mode: 'payment',
 *   success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
 *   cancel_url: 'https://example.com/cancel',
 * };
 * const session = await createCheckoutSession({ stripe, params: sessionParams });
 */
export const createCheckoutSession = async ({
  stripe,
  params,
  options,
}: {
  stripe: Stripe | StripeOptions;
  params: Stripe.Checkout.SessionCreateParams;
  options?: Stripe.RequestOptions;
}): Promise<Stripe.Checkout.Session> => {
  const stripeClient = stripe instanceof Stripe ? stripe : initStripe(stripe);

  // Basic validation for required fields
  if (!params.line_items || params.line_items.length === 0) {
    throw new Error("Checkout session requires at least one line_item.");
  }
  if (!params.mode) {
    throw new Error(
      "Checkout session requires a mode ('payment', 'setup', or 'subscription').",
    );
  }
  if (!params.success_url) {
    throw new Error("Checkout session requires a success_url.");
  }
  if (!params.cancel_url) {
    throw new Error("Checkout session requires a cancel_url.");
  }

  return stripeClient.checkout.sessions.create(params, options);
};
