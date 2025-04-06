import {
  useMutation,
  useQueryClient,
  UseMutationResult,
} from "@tanstack/react-query";
import Stripe from "stripe";
import { createCheckoutSession } from "./checkouts"; // Assuming checkouts.ts is in the same directory
import { StripeOptions } from "../utils"; // Import shared options type

// No longer need StripeHookOptions, the mutation input type covers it
// interface StripeHookOptions {
//   stripe: Stripe | StripeOptions;
// }

/**
 * Creates a new Stripe Checkout Session.
 * This hook provides a mutation function to create a session.
 * @returns A UseMutationResult object. Call mutate with { stripe, params, options? }.
 * @example
 * const stripeOptions = { apiKey: 'sk_test_...' }; // Or your initialized Stripe client
 * const mutation = useCreateStripeCheckoutSession();
 * mutation.mutate({
 *   stripe: stripeOptions,
 *   params: { ...checkoutCreateParams }, // See Stripe.Checkout.SessionCreateParams
 * }, {
 *   onSuccess: (session) => {
 *     // Redirect to session.url or handle success
 *     console.log('Checkout session created:', session.id);
 *     if (session.url) {
 *       window.location.href = session.url;
 *     }
 *   },
 *   onError: (error) => {
 *     console.error('Failed to create checkout session:', error);
 *   }
 * });
 */
export const useCreateStripeCheckoutSession = (): UseMutationResult<
  Stripe.Checkout.Session,
  Error,
  {
    stripe: Stripe | StripeOptions; // Use imported StripeOptions
    params: Stripe.Checkout.SessionCreateParams;
    options?: Stripe.RequestOptions;
  }
> => {
  // const queryClient = useQueryClient(); // Query client might not be needed unless invalidating other queries

  return useMutation<
    Stripe.Checkout.Session,
    Error,
    {
      stripe: Stripe | StripeOptions; // Use imported StripeOptions
      params: Stripe.Checkout.SessionCreateParams;
      options?: Stripe.RequestOptions;
    }
  >({
    mutationFn: async ({ stripe, params, options }) => {
      if (!stripe) throw new Error("Stripe client or options are required.");
      // Pass the object directly to the RORO function
      return createCheckoutSession({ stripe, params, options });
    },
    // No default onSuccess invalidation needed for checkout sessions typically,
    // as they are usually single-use redirects.
    // Add invalidations if creating a session should refresh other data (e.g., order status).
    // onSuccess: (data) => {
    //   queryClient.invalidateQueries({ queryKey: ['someOtherQuery'] });
    // }
  });
};
