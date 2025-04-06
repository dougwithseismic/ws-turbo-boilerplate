import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import Stripe from "stripe";
import { StripeOptions } from "../utils"; // Import shared options type
import {
  createCustomer,
  fetchCustomerById,
  updateCustomer,
  deleteCustomer,
  listCustomers,
} from "./customers";

// Common interface for hooks requiring Stripe client/options
interface StripeHookOptions {
  stripe: Stripe | StripeOptions;
}

/**
 * Fetches a specific Stripe customer by its ID using React Query.
 * @param id The ID of the customer to fetch.
 * @param hookOptions Options including the Stripe client instance or init options.
 * @param queryOptions Optional React Query options.
 * @returns A UseQueryResult object for the Stripe Customer.
 */
export const useStripeCustomer = (
  id: string,
  hookOptions: StripeHookOptions,
  queryOptions?: { enabled?: boolean }, // Add other React Query options as needed
): UseQueryResult<Stripe.Customer | Stripe.DeletedCustomer, Error> => {
  const { stripe } = hookOptions;

  return useQuery<Stripe.Customer | Stripe.DeletedCustomer, Error>({
    queryKey: ["stripeCustomers", id],
    queryFn: async () => {
      if (!stripe) throw new Error("Stripe client or options are required.");
      const customer = await fetchCustomerById({
        stripe,
        id /*, params: {} */,
      });
      return customer;
    },
    enabled: !!id && !!stripe && queryOptions?.enabled !== false,
  });
};

/**
 * Fetches a list of Stripe customers using React Query.
 * @param params Parameters for listing customers (e.g., limit, email). See Stripe.CustomerListParams.
 * @param hookOptions Options including the Stripe client instance or init options.
 * @param queryOptions Optional React Query options.
 * @returns A UseQueryResult object for the list of Stripe Customers.
 */
export const useStripeCustomers = (
  params: Stripe.CustomerListParams = { limit: 10 }, // Default limit
  hookOptions: StripeHookOptions,
  queryOptions?: { enabled?: boolean },
): UseQueryResult<Stripe.ApiList<Stripe.Customer>, Error> => {
  const { stripe } = hookOptions;

  return useQuery<Stripe.ApiList<Stripe.Customer>, Error>({
    queryKey: ["stripeCustomers", params],
    queryFn: async () => {
      if (!stripe) throw new Error("Stripe client or options are required.");
      const customerList = await listCustomers({ stripe, params });
      return customerList;
    },
    enabled: !!stripe && queryOptions?.enabled !== false,
  });
};

/**
 * Creates a new Stripe customer.
 * @returns A UseMutationResult object. Call mutate with { stripe, params, options? }.
 */
export const useCreateStripeCustomer = (): UseMutationResult<
  Stripe.Customer,
  Error,
  {
    stripe: Stripe | StripeOptions;
    params: Stripe.CustomerCreateParams;
    options?: Stripe.RequestOptions;
  }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    Stripe.Customer,
    Error,
    {
      stripe: Stripe | StripeOptions;
      params: Stripe.CustomerCreateParams;
      options?: Stripe.RequestOptions;
    }
  >({
    mutationFn: async ({ stripe, params, options }) => {
      if (!stripe) throw new Error("Stripe client or options are required.");
      return createCustomer({ stripe, params, options });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["stripeCustomers"] });
      queryClient.setQueryData(["stripeCustomers", data.id], data);
    },
  });
};

/**
 * Updates an existing Stripe customer.
 * @returns A UseMutationResult object. Call mutate with { stripe, id, params, options? }.
 */
export const useUpdateStripeCustomer = (): UseMutationResult<
  Stripe.Customer,
  Error,
  {
    stripe: Stripe | StripeOptions;
    id: string;
    params: Stripe.CustomerUpdateParams;
    options?: Stripe.RequestOptions;
  }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    Stripe.Customer,
    Error,
    {
      stripe: Stripe | StripeOptions;
      id: string;
      params: Stripe.CustomerUpdateParams;
      options?: Stripe.RequestOptions;
    }
  >({
    mutationFn: async ({ stripe, id, params, options }) => {
      if (!stripe) throw new Error("Stripe client or options are required.");
      return updateCustomer({ stripe, id, params, options });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stripeCustomers"] });
      queryClient.invalidateQueries({
        queryKey: ["stripeCustomers", variables.id],
      });
      queryClient.setQueryData(["stripeCustomers", variables.id], data);
    },
  });
};

/**
 * Deletes a Stripe customer.
 * @returns A UseMutationResult object. Call mutate with { stripe, id, options? }.
 */
export const useDeleteStripeCustomer = (): UseMutationResult<
  Stripe.DeletedCustomer,
  Error,
  {
    stripe: Stripe | StripeOptions;
    id: string;
    options?: Stripe.RequestOptions;
  }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    Stripe.DeletedCustomer,
    Error,
    {
      stripe: Stripe | StripeOptions;
      id: string;
      options?: Stripe.RequestOptions;
    }
  >({
    mutationFn: async ({ stripe, id, options }) => {
      if (!stripe) throw new Error("Stripe client or options are required.");
      return deleteCustomer({ stripe, id, options });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stripeCustomers"] });
      queryClient.removeQueries({
        queryKey: ["stripeCustomers", variables.id],
      });
    },
  });
};
