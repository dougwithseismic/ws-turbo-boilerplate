import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import Stripe from "stripe";
import { StripeOptions } from "../utils";
import {
  createSubscription,
  fetchSubscriptionById,
  updateSubscription,
  cancelSubscription,
  listSubscriptions,
} from "./subscriptions";

// Common interface for hooks requiring Stripe client/options
interface StripeHookOptions {
  stripe: Stripe | StripeOptions;
}

/**
 * Fetches a specific Stripe subscription by its ID using React Query.
 * @param id The ID of the subscription to fetch.
 * @param hookOptions Options including the Stripe client instance or init options.
 * @param queryOptions Optional React Query options.
 * @returns A UseQueryResult object for the Stripe Subscription.
 */
export const useStripeSubscription = (
  id: string,
  hookOptions: StripeHookOptions,
  queryOptions?: { enabled?: boolean },
): UseQueryResult<Stripe.Subscription, Error> => {
  const { stripe } = hookOptions;

  return useQuery<Stripe.Subscription, Error>({
    queryKey: ["stripeSubscriptions", id],
    queryFn: async () => {
      if (!stripe) throw new Error("Stripe client or options are required.");
      const subscription = await fetchSubscriptionById({
        stripe,
        id /*, params: {} */,
      });
      return subscription;
    },
    enabled: !!id && !!stripe && queryOptions?.enabled !== false,
  });
};

/**
 * Fetches a list of Stripe subscriptions using React Query.
 * @param params Parameters for listing subscriptions (e.g., limit, customer, status). See Stripe.SubscriptionListParams.
 * @param hookOptions Options including the Stripe client instance or init options.
 * @param queryOptions Optional React Query options.
 * @returns A UseQueryResult object for the list of Stripe Subscriptions.
 */
export const useStripeSubscriptions = (
  params: Stripe.SubscriptionListParams = { limit: 10 }, // Default limit
  hookOptions: StripeHookOptions,
  queryOptions?: { enabled?: boolean },
): UseQueryResult<Stripe.ApiList<Stripe.Subscription>, Error> => {
  const { stripe } = hookOptions;

  return useQuery<Stripe.ApiList<Stripe.Subscription>, Error>({
    queryKey: ["stripeSubscriptions", params],
    queryFn: async () => {
      if (!stripe) throw new Error("Stripe client or options are required.");
      const subscriptionList = await listSubscriptions({ stripe, params });
      return subscriptionList;
    },
    enabled: !!stripe && queryOptions?.enabled !== false,
  });
};

/**
 * Creates a new Stripe subscription.
 * @returns A UseMutationResult object. Call mutate with { stripe, params, options? }.
 */
export const useCreateStripeSubscription = (): UseMutationResult<
  Stripe.Subscription,
  Error,
  {
    stripe: Stripe | StripeOptions;
    params: Stripe.SubscriptionCreateParams;
    options?: Stripe.RequestOptions;
  }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    Stripe.Subscription,
    Error,
    {
      stripe: Stripe | StripeOptions;
      params: Stripe.SubscriptionCreateParams;
      options?: Stripe.RequestOptions;
    }
  >({
    mutationFn: async ({ stripe, params, options }) => {
      if (!stripe) throw new Error("Stripe client or options are required.");
      return createSubscription({ stripe, params, options });
    },
    onSuccess: (data) => {
      // Invalidate list queries that might include this new subscription
      // Consider more specific invalidations based on customer or status if needed
      queryClient.invalidateQueries({ queryKey: ["stripeSubscriptions"] });
      // Optionally prime the cache
      queryClient.setQueryData(["stripeSubscriptions", data.id], data);
      // Invalidate customer-specific subscription lists if applicable
      if (data.customer) {
        const customerId =
          typeof data.customer === "string" ? data.customer : data.customer.id;
        queryClient.invalidateQueries({
          queryKey: ["stripeSubscriptions", { customer: customerId }],
        });
      }
    },
  });
};

/**
 * Updates an existing Stripe subscription.
 * @returns A UseMutationResult object. Call mutate with { stripe, id, params, options? }.
 */
export const useUpdateStripeSubscription = (): UseMutationResult<
  Stripe.Subscription,
  Error,
  {
    stripe: Stripe | StripeOptions;
    id: string;
    params: Stripe.SubscriptionUpdateParams;
    options?: Stripe.RequestOptions;
  }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    Stripe.Subscription,
    Error,
    {
      stripe: Stripe | StripeOptions;
      id: string;
      params: Stripe.SubscriptionUpdateParams;
      options?: Stripe.RequestOptions;
    }
  >({
    mutationFn: async ({ stripe, id, params, options }) => {
      if (!stripe) throw new Error("Stripe client or options are required.");
      return updateSubscription({ stripe, id, params, options });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stripeSubscriptions"] });
      queryClient.invalidateQueries({
        queryKey: ["stripeSubscriptions", variables.id],
      });
      queryClient.setQueryData(["stripeSubscriptions", variables.id], data);
      // Invalidate customer-specific subscription lists if applicable
      if (data.customer) {
        const customerId =
          typeof data.customer === "string" ? data.customer : data.customer.id;
        queryClient.invalidateQueries({
          queryKey: ["stripeSubscriptions", { customer: customerId }],
        });
      }
    },
  });
};

/**
 * Cancels a Stripe subscription.
 * @returns A UseMutationResult object. Call mutate with { stripe, id, params?, options? }.
 */
export const useCancelStripeSubscription = (): UseMutationResult<
  Stripe.Subscription, // Returns the canceled subscription object
  Error,
  {
    stripe: Stripe | StripeOptions;
    id: string;
    params?: Stripe.SubscriptionCancelParams;
    options?: Stripe.RequestOptions;
  }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    Stripe.Subscription,
    Error,
    {
      stripe: Stripe | StripeOptions;
      id: string;
      params?: Stripe.SubscriptionCancelParams;
      options?: Stripe.RequestOptions;
    }
  >({
    mutationFn: async ({ stripe, id, params, options }) => {
      if (!stripe) throw new Error("Stripe client or options are required.");
      return cancelSubscription({ stripe, id, params, options });
    },
    onSuccess: (data, variables) => {
      // Invalidate the list and specific item query
      queryClient.invalidateQueries({ queryKey: ["stripeSubscriptions"] });
      // Update the item in the cache to reflect canceled status
      queryClient.setQueryData(["stripeSubscriptions", variables.id], data);
      // Invalidate customer-specific subscription lists if applicable
      if (data.customer) {
        const customerId =
          typeof data.customer === "string" ? data.customer : data.customer.id;
        queryClient.invalidateQueries({
          queryKey: ["stripeSubscriptions", { customer: customerId }],
        });
      }
    },
  });
};
