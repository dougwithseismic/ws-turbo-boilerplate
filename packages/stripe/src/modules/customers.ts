import Stripe from "stripe";
import { initStripe, StripeOptions } from "../utils";

/**
 * Creates a new Stripe customer.
 * @param args Object containing stripe client/options and create parameters.
 * @param args.stripe - Initialized Stripe client instance or StripeOptions.
 * @param args.params - Parameters for creating the customer (e.g., email, name, description). See Stripe.CustomerCreateParams.
 * @param args.options - Optional Stripe request options.
 * @returns A promise that resolves to the newly created Stripe.Customer.
 */
export const createCustomer = async ({
  stripe,
  params,
  options,
}: {
  stripe: Stripe | StripeOptions;
  params: Stripe.CustomerCreateParams;
  options?: Stripe.RequestOptions;
}): Promise<Stripe.Customer> => {
  const stripeClient = stripe instanceof Stripe ? stripe : initStripe(stripe);
  return stripeClient.customers.create(params, options);
};

/**
 * Fetches a Stripe customer by its ID.
 * @param args Object containing stripe client/options, customer ID, and optional retrieve parameters.
 * @param args.stripe - Initialized Stripe client instance or StripeOptions.
 * @param args.id - The ID of the customer to fetch.
 * @param args.params - Optional parameters (e.g., expand). See Stripe.CustomerRetrieveParams.
 * @param args.options - Optional Stripe request options.
 * @returns A promise that resolves to the fetched Stripe.Customer or Stripe.DeletedCustomer if deleted.
 */
export const fetchCustomerById = async ({
  stripe,
  id,
  params,
  options,
}: {
  stripe: Stripe | StripeOptions;
  id: string;
  params?: Stripe.CustomerRetrieveParams;
  options?: Stripe.RequestOptions;
}): Promise<Stripe.Customer | Stripe.DeletedCustomer> => {
  const stripeClient = stripe instanceof Stripe ? stripe : initStripe(stripe);
  return stripeClient.customers.retrieve(id, params, options);
};

/**
 * Updates an existing Stripe customer.
 * @param args Object containing stripe client/options, customer ID, and update parameters.
 * @param args.stripe - Initialized Stripe client instance or StripeOptions.
 * @param args.id - The ID of the customer to update.
 * @param args.params - Parameters to update (e.g., email, name, metadata). See Stripe.CustomerUpdateParams.
 * @param args.options - Optional Stripe request options.
 * @returns A promise that resolves to the updated Stripe.Customer.
 */
export const updateCustomer = async ({
  stripe,
  id,
  params,
  options,
}: {
  stripe: Stripe | StripeOptions;
  id: string;
  params: Stripe.CustomerUpdateParams;
  options?: Stripe.RequestOptions;
}): Promise<Stripe.Customer> => {
  const stripeClient = stripe instanceof Stripe ? stripe : initStripe(stripe);
  return stripeClient.customers.update(id, params, options);
};

/**
 * Deletes a Stripe customer by its ID.
 * Note: Deleting a customer is irreversible and might affect associated subscriptions or invoices.
 * @param args Object containing stripe client/options and customer ID.
 * @param args.stripe - Initialized Stripe client instance or StripeOptions.
 * @param args.id - The ID of the customer to delete.
 * @param args.options - Optional Stripe request options.
 * @returns A promise that resolves to the Stripe.DeletedCustomer confirmation.
 */
export const deleteCustomer = async ({
  stripe,
  id,
  options,
}: {
  stripe: Stripe | StripeOptions;
  id: string;
  options?: Stripe.RequestOptions;
}): Promise<Stripe.DeletedCustomer> => {
  const stripeClient = stripe instanceof Stripe ? stripe : initStripe(stripe);
  return stripeClient.customers.del(id, options);
};

/**
 * Lists Stripe customers with optional filters and pagination.
 * @param args Object containing stripe client/options and optional list parameters.
 * @param args.stripe - Initialized Stripe client instance or StripeOptions.
 * @param args.params - Parameters for listing customers (e.g., limit, email, created). See Stripe.CustomerListParams.
 * @param args.options - Optional Stripe request options.
 * @returns A promise that resolves to a list of Stripe.Customer objects.
 */
export const listCustomers = async ({
  stripe,
  params,
  options,
}: {
  stripe: Stripe | StripeOptions;
  params?: Stripe.CustomerListParams;
  options?: Stripe.RequestOptions;
}): Promise<Stripe.ApiList<Stripe.Customer>> => {
  const stripeClient = stripe instanceof Stripe ? stripe : initStripe(stripe);
  return stripeClient.customers.list(params, options);
};
