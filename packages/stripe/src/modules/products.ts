import Stripe from "stripe";
import { initStripe, StripeOptions } from "../utils"; // Import shared utility

/**
 * Creates a new Stripe product.
 * @param args Object containing stripe client/options and create parameters.
 * @param args.stripe - Initialized Stripe client instance or StripeOptions.
 * @param args.params - Parameters for creating the product (e.g., name, description). See Stripe.ProductCreateParams.
 * @param args.options - Optional Stripe request options.
 * @returns A promise that resolves to the newly created Stripe.Product.
 * @example
 * const stripe = initStripe({ apiKey: 'sk_test_...' });
 * const product = await createProduct({ stripe, params: { name: 'My Awesome Product' } });
 */
export const createProduct = async ({
  stripe,
  params,
  options,
}: {
  stripe: Stripe | StripeOptions;
  params: Stripe.ProductCreateParams;
  options?: Stripe.RequestOptions;
}): Promise<Stripe.Product> => {
  const stripeClient = stripe instanceof Stripe ? stripe : initStripe(stripe);
  return stripeClient.products.create(params, options);
};

/**
 * Fetches a Stripe product by its ID.
 * @param args Object containing stripe client/options, product ID, and optional retrieve parameters.
 * @param args.stripe - Initialized Stripe client instance or StripeOptions.
 * @param args.id - The ID of the product to fetch.
 * @param args.params - Optional parameters (e.g., expand). See Stripe.ProductRetrieveParams.
 * @param args.options - Optional Stripe request options.
 * @returns A promise that resolves to the fetched Stripe.Product or Stripe.DeletedProduct if deleted.
 * @example
 * const stripe = initStripe({ apiKey: 'sk_test_...' });
 * const product = await fetchProductById({ stripe, id: 'prod_...' });
 */
export const fetchProductById = async ({
  stripe,
  id,
  params,
  options,
}: {
  stripe: Stripe | StripeOptions;
  id: string;
  params?: Stripe.ProductRetrieveParams;
  options?: Stripe.RequestOptions;
}): Promise<Stripe.Product | Stripe.DeletedProduct> => {
  const stripeClient = stripe instanceof Stripe ? stripe : initStripe(stripe);
  return stripeClient.products.retrieve(id, params, options);
};

/**
 * Updates an existing Stripe product.
 * @param args Object containing stripe client/options, product ID, and update parameters.
 * @param args.stripe - Initialized Stripe client instance or StripeOptions.
 * @param args.id - The ID of the product to update.
 * @param args.params - Parameters to update (e.g., name, description). See Stripe.ProductUpdateParams.
 * @param args.options - Optional Stripe request options.
 * @returns A promise that resolves to the updated Stripe.Product.
 * @example
 * const stripe = initStripe({ apiKey: 'sk_test_...' });
 * const updatedProduct = await updateProduct({ stripe, id: 'prod_...', params: { description: 'New description' } });
 */
export const updateProduct = async ({
  stripe,
  id,
  params,
  options,
}: {
  stripe: Stripe | StripeOptions;
  id: string;
  params: Stripe.ProductUpdateParams;
  options?: Stripe.RequestOptions;
}): Promise<Stripe.Product> => {
  const stripeClient = stripe instanceof Stripe ? stripe : initStripe(stripe);
  return stripeClient.products.update(id, params, options);
};

/**
 * Deletes a Stripe product by its ID.
 * @param args Object containing stripe client/options and product ID.
 * @param args.stripe - Initialized Stripe client instance or StripeOptions.
 * @param args.id - The ID of the product to delete.
 * @param args.options - Optional Stripe request options.
 * @returns A promise that resolves to the Stripe.DeletedProduct confirmation.
 * @example
 * const stripe = initStripe({ apiKey: 'sk_test_...' });
 * const deletedConfirmation = await deleteProduct({ stripe, id: 'prod_...' });
 */
export const deleteProduct = async ({
  stripe,
  id,
  options,
}: {
  stripe: Stripe | StripeOptions;
  id: string;
  options?: Stripe.RequestOptions;
}): Promise<Stripe.DeletedProduct> => {
  const stripeClient = stripe instanceof Stripe ? stripe : initStripe(stripe);
  return stripeClient.products.del(id, options);
};

/**
 * Lists Stripe products with optional filters and pagination.
 * @param args Object containing stripe client/options and optional list parameters.
 * @param args.stripe - Initialized Stripe client instance or StripeOptions.
 * @param args.params - Parameters for listing products (e.g., limit, active, starting_after). See Stripe.ProductListParams.
 * @param args.options - Optional Stripe request options.
 * @returns A promise that resolves to a list of Stripe.Product objects.
 * @example
 * const stripe = initStripe({ apiKey: 'sk_test_...' });
 * const products = await listProducts({ stripe, params: { limit: 10, active: true } });
 */
export const listProducts = async ({
  stripe,
  params,
  options,
}: {
  stripe: Stripe | StripeOptions;
  params?: Stripe.ProductListParams;
  options?: Stripe.RequestOptions;
}): Promise<Stripe.ApiList<Stripe.Product>> => {
  const stripeClient = stripe instanceof Stripe ? stripe : initStripe(stripe);
  return stripeClient.products.list(params, options);
};
