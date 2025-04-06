import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import Stripe from "stripe";
import {
  createProduct,
  fetchProductById,
  updateProduct,
  deleteProduct,
  listProducts,
} from "./products"; // Assuming products.ts is in the same directory
import { StripeOptions } from "../utils"; // Import shared options type

// Define a type for the options object to pass the Stripe client/options
interface StripeHookOptions {
  stripe: Stripe | StripeOptions;
}

/**
 * Fetches a specific Stripe product by its ID using React Query.
 * @param id The ID of the product to fetch.
 * @param hookOptions Options including the Stripe client instance or init options.
 * @param queryOptions Optional React Query options.
 * @returns A UseQueryResult object for the Stripe Product.
 */
export const useStripeProduct = (
  id: string,
  hookOptions: StripeHookOptions,
  queryOptions?: { enabled?: boolean }, // Add other React Query options as needed
): UseQueryResult<Stripe.Product | Stripe.DeletedProduct, Error> => {
  const { stripe } = hookOptions;

  return useQuery<Stripe.Product | Stripe.DeletedProduct, Error>({
    queryKey: ["stripeProducts", id],
    queryFn: async () => {
      if (!stripe) throw new Error("Stripe client or options are required.");
      // Pass retrieve params if needed, ensure ID is passed correctly
      const product = await fetchProductById({ stripe, id /*, params: {} */ });
      return product;
    },
    enabled: !!id && !!stripe && queryOptions?.enabled !== false,
  });
};

/**
 * Fetches a list of Stripe products using React Query.
 * @param params Parameters for listing products (e.g., limit, active). See Stripe.ProductListParams.
 * @param hookOptions Options including the Stripe client instance or init options.
 * @param queryOptions Optional React Query options.
 * @returns A UseQueryResult object for the list of Stripe Products.
 */
export const useStripeProducts = (
  params: Stripe.ProductListParams = { limit: 10 }, // Default limit
  hookOptions: StripeHookOptions,
  queryOptions?: { enabled?: boolean }, // Add other React Query options as needed
): UseQueryResult<Stripe.ApiList<Stripe.Product>, Error> => {
  const { stripe } = hookOptions;

  return useQuery<Stripe.ApiList<Stripe.Product>, Error>({
    // Include params in queryKey for caching based on filters
    queryKey: ["stripeProducts", params],
    queryFn: async () => {
      if (!stripe) throw new Error("Stripe client or options are required.");
      // Pass params directly to listProducts
      const productList = await listProducts({ stripe, params });
      return productList;
    },
    enabled: !!stripe && queryOptions?.enabled !== false,
  });
};

/**
 * Creates a new Stripe product.
 * @returns A UseMutationResult object. Call mutate with { stripe, params, options? }.
 */
export const useCreateStripeProduct = (): UseMutationResult<
  Stripe.Product,
  Error,
  {
    stripe: Stripe | StripeOptions;
    params: Stripe.ProductCreateParams;
    options?: Stripe.RequestOptions;
  }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    Stripe.Product,
    Error,
    {
      stripe: Stripe | StripeOptions;
      params: Stripe.ProductCreateParams;
      options?: Stripe.RequestOptions;
    }
  >({
    mutationFn: async ({ stripe, params, options }) => {
      if (!stripe) throw new Error("Stripe client or options are required.");
      return createProduct({ stripe, params, options });
    },
    onSuccess: (data) => {
      // Invalidate the general list query
      queryClient.invalidateQueries({ queryKey: ["stripeProducts"] });
      // Optionally prime the cache for the new item
      queryClient.setQueryData(["stripeProducts", data.id], data);
    },
  });
};

/**
 * Updates an existing Stripe product.
 * @returns A UseMutationResult object. Call mutate with { stripe, id, params, options? }.
 */
export const useUpdateStripeProduct = (): UseMutationResult<
  Stripe.Product,
  Error,
  {
    stripe: Stripe | StripeOptions;
    id: string;
    params: Stripe.ProductUpdateParams;
    options?: Stripe.RequestOptions;
  }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    Stripe.Product,
    Error,
    {
      stripe: Stripe | StripeOptions;
      id: string;
      params: Stripe.ProductUpdateParams;
      options?: Stripe.RequestOptions;
    }
  >({
    mutationFn: async ({ stripe, id, params, options }) => {
      if (!stripe) throw new Error("Stripe client or options are required.");
      return updateProduct({ stripe, id, params, options });
    },
    onSuccess: (data, variables) => {
      // Invalidate the list and the specific item query
      queryClient.invalidateQueries({ queryKey: ["stripeProducts"] });
      queryClient.invalidateQueries({
        queryKey: ["stripeProducts", variables.id],
      });
      // Update the cache for the updated item
      queryClient.setQueryData(["stripeProducts", variables.id], data);
    },
  });
};

/**
 * Deletes a Stripe product.
 * @returns A UseMutationResult object. Call mutate with { stripe, id, options? }.
 */
export const useDeleteStripeProduct = (): UseMutationResult<
  Stripe.DeletedProduct,
  Error,
  {
    stripe: Stripe | StripeOptions;
    id: string;
    options?: Stripe.RequestOptions;
  }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    Stripe.DeletedProduct,
    Error,
    {
      stripe: Stripe | StripeOptions;
      id: string;
      options?: Stripe.RequestOptions;
    }
  >({
    mutationFn: async ({ stripe, id, options }) => {
      if (!stripe) throw new Error("Stripe client or options are required.");
      return deleteProduct({ stripe, id, options });
    },
    onSuccess: (data, variables) => {
      // Invalidate the list query
      queryClient.invalidateQueries({ queryKey: ["stripeProducts"] });
      // Remove the specific item query from cache
      queryClient.removeQueries({ queryKey: ["stripeProducts", variables.id] });
    },
  });
};
