import Stripe from "stripe";
import { initStripe, StripeOptions } from "../utils";

/**
 * Creates a new Stripe subscription.
 * Requires a customer ID and at least one item (usually a price ID).
 * @param args Object containing stripe client/options and create parameters.
 * @param args.stripe - Initialized Stripe client instance or StripeOptions.
 * @param args.params - Parameters for creating the subscription. See Stripe.SubscriptionCreateParams.
 * @param args.options - Optional Stripe request options.
 * @returns A promise that resolves to the newly created Stripe.Subscription.
 */
export const createSubscription = async ({
  stripe,
  params,
  options,
}: {
  stripe: Stripe | StripeOptions;
  params: Stripe.SubscriptionCreateParams;
  options?: Stripe.RequestOptions;
}): Promise<Stripe.Subscription> => {
  const stripeClient = stripe instanceof Stripe ? stripe : initStripe(stripe);
  if (!params.customer) {
    throw new Error("Subscription creation requires a customer ID.");
  }
  if (!params.items || params.items.length === 0) {
    throw new Error("Subscription creation requires at least one item.");
  }
  return stripeClient.subscriptions.create(params, options);
};

/**
 * Fetches a Stripe subscription by its ID.
 * @param args Object containing stripe client/options, subscription ID, and optional retrieve parameters.
 * @param args.stripe - Initialized Stripe client instance or StripeOptions.
 * @param args.id - The ID of the subscription to fetch.
 * @param args.params - Optional parameters (e.g., expand). See Stripe.SubscriptionRetrieveParams.
 * @param args.options - Optional Stripe request options.
 * @returns A promise that resolves to the fetched Stripe.Subscription.
 */
export const fetchSubscriptionById = async ({
  stripe,
  id,
  params,
  options,
}: {
  stripe: Stripe | StripeOptions;
  id: string;
  params?: Stripe.SubscriptionRetrieveParams;
  options?: Stripe.RequestOptions;
}): Promise<Stripe.Subscription> => {
  const stripeClient = stripe instanceof Stripe ? stripe : initStripe(stripe);
  return stripeClient.subscriptions.retrieve(id, params, options);
};

/**
 * Updates an existing Stripe subscription.
 * Can be used to change items, quantities, billing details, etc.
 * @param args Object containing stripe client/options, subscription ID, and update parameters.
 * @param args.stripe - Initialized Stripe client instance or StripeOptions.
 * @param args.id - The ID of the subscription to update.
 * @param args.params - Parameters to update. See Stripe.SubscriptionUpdateParams.
 * @param args.options - Optional Stripe request options.
 * @returns A promise that resolves to the updated Stripe.Subscription.
 */
export const updateSubscription = async ({
  stripe,
  id,
  params,
  options,
}: {
  stripe: Stripe | StripeOptions;
  id: string;
  params: Stripe.SubscriptionUpdateParams;
  options?: Stripe.RequestOptions;
}): Promise<Stripe.Subscription> => {
  const stripeClient = stripe instanceof Stripe ? stripe : initStripe(stripe);
  return stripeClient.subscriptions.update(id, params, options);
};

/**
 * Cancels a Stripe subscription by its ID.
 * By default, cancellation is effective immediately. Use params for options like prorations or end of billing period cancellation.
 * @param args Object containing stripe client/options, subscription ID, and optional cancel parameters.
 * @param args.stripe - Initialized Stripe client instance or StripeOptions.
 * @param args.id - The ID of the subscription to cancel.
 * @param args.params - Optional parameters for cancellation. See Stripe.SubscriptionCancelParams.
 * @param args.options - Optional Stripe request options.
 * @returns A promise that resolves to the canceled Stripe.Subscription object (status will be 'canceled').
 */
export const cancelSubscription = async ({
  stripe,
  id,
  params,
  options,
}: {
  stripe: Stripe | StripeOptions;
  id: string;
  params?: Stripe.SubscriptionCancelParams;
  options?: Stripe.RequestOptions;
}): Promise<Stripe.Subscription> => {
  const stripeClient = stripe instanceof Stripe ? stripe : initStripe(stripe);
  // The SDK method was 'del', now it's 'cancel'
  return stripeClient.subscriptions.cancel(id, params, options);
};

/**
 * Lists Stripe subscriptions with optional filters and pagination.
 * Often filtered by customer ID or status.
 * @param args Object containing stripe client/options and optional list parameters.
 * @param args.stripe - Initialized Stripe client instance or StripeOptions.
 * @param args.params - Parameters for listing subscriptions (e.g., limit, customer, status, price). See Stripe.SubscriptionListParams.
 * @param args.options - Optional Stripe request options.
 * @returns A promise that resolves to a list of Stripe.Subscription objects.
 */
export const listSubscriptions = async ({
  stripe,
  params,
  options,
}: {
  stripe: Stripe | StripeOptions;
  params?: Stripe.SubscriptionListParams;
  options?: Stripe.RequestOptions;
}): Promise<Stripe.ApiList<Stripe.Subscription>> => {
  const stripeClient = stripe instanceof Stripe ? stripe : initStripe(stripe);
  return stripeClient.subscriptions.list(params, options);
};
