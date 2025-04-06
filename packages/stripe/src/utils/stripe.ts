import Stripe from "stripe";

/**
 * Interface for Stripe client initialization options.
 */
export interface StripeOptions {
  apiKey: string;
  apiVersion?: Stripe.LatestApiVersion;
}

/**
 * Initializes the Stripe client.
 * @param options - The Stripe API key and optional API version.
 * @returns The initialized Stripe instance.
 * @throws Error if apiKey is missing.
 */
export const initStripe = (options: StripeOptions): Stripe => {
  if (!options.apiKey) {
    throw new Error("Stripe API key is required.");
  }
  return new Stripe(options.apiKey, {
    apiVersion: options.apiVersion, // Pass provided version or undefined (Stripe uses latest by default)
    typescript: true,
  });
};
