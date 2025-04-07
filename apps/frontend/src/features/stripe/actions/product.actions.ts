"use server";

import { stripe } from "@/lib/stripe/config";
import type Stripe from "stripe";

export interface ProductWithPrice extends Stripe.Product {
  default_price: Stripe.Price;
}

export async function fetchStripeProducts(): Promise<ProductWithPrice[]> {
  console.log("Fetching Stripe products via server action...");
  try {
    // Fetch active products and expand their default price
    const products = await stripe.products.list({
      active: true,
      expand: ["data.default_price"],
      limit: 10, // Adjust limit as needed
    });

    // Filter out products that don't have a default price or whose default price isn't an object
    const productsWithPrices = products.data.filter(
      (product: Stripe.Product): product is ProductWithPrice => {
        // Explicit boolean return to satisfy type checker
        return !!(
          product.default_price && typeof product.default_price === "object"
        );
      },
    );

    console.log(`Successfully fetched ${productsWithPrices.length} products.`);
    return productsWithPrices;
  } catch (error: unknown) {
    console.error("Error fetching Stripe products:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown server error occurred";
    // Re-throw a more specific error or return an empty array/error object
    // depending on how you want the caller to handle failures.
    // For now, re-throwing to let the caller (e.g., page component) handle it.
    throw new Error(`Failed to fetch products: ${errorMessage}`);
  }
}
