"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/config";
import { createCheckoutSession as createStripeCheckoutSession } from "@maestro/stripe"; // Renamed import to avoid conflict
import Stripe from "stripe";
import { headers } from "next/headers"; // To get referer for cancel/success URLs if needed

// Helper function (kept private to this module for now)
async function findOrCreateStripeCustomer(
  supabaseUserId: string,
  email: string,
): Promise<string> {
  if (!email) {
    throw new Error("Email is required to find or create a Stripe customer.");
  }
  console.log(
    `Attempting to find or create Stripe customer for email: ${email}, Supabase User ID: ${supabaseUserId}`,
  );

  const listResult = await stripe.customers.list({ email: email, limit: 1 });

  if (listResult.data.length > 0) {
    const existingCustomer = listResult.data[0];
    console.log(
      `Found existing Stripe customer ${existingCustomer.id} for email ${email}`,
    );
    if (existingCustomer.metadata?.supabase_user_id !== supabaseUserId) {
      console.log(
        `Updating metadata for Stripe customer ${existingCustomer.id} to link Supabase user ${supabaseUserId}`,
      );
      await stripe.customers.update(existingCustomer.id, {
        metadata: { supabase_user_id: supabaseUserId },
      });
    }
    return existingCustomer.id;
  }

  console.log(
    `No existing Stripe customer found for email ${email}. Creating a new one.`,
  );
  const customerParams: Stripe.CustomerCreateParams = {
    email: email,
    metadata: { supabase_user_id: supabaseUserId },
  };

  const newCustomer = await stripe.customers.create(customerParams);
  console.log(
    `Created new Stripe customer ${newCustomer.id} for Supabase user ${supabaseUserId}`,
  );
  return newCustomer.id;
}

interface CreateCheckoutArgs {
  priceId: string;
  mode?: Stripe.Checkout.SessionCreateParams.Mode;
  quantity?: number;
}

interface CheckoutResult {
  sessionId: string;
  url: string;
}

// Server Action
export async function createCheckoutSession({
  priceId,
  mode = "subscription",
  quantity = 1,
}: CreateCheckoutArgs): Promise<CheckoutResult> {
  console.log(
    `Creating checkout session via server action for price ${priceId}, mode ${mode}`,
  );
  const supabase = await createSupabaseServerClient(); // Server client works in server actions
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    console.error("Authentication error in createCheckoutSession:", userError);
    throw new Error("Unauthorized: User must be logged in.");
  }

  const { user } = userData;

  if (!user.email) {
    console.error("User email is missing for Supabase user:", user.id);
    throw new Error("User email is missing, cannot process payment.");
  }

  if (!priceId) {
    throw new Error("priceId is required.");
  }

  if (!["payment", "subscription"].includes(mode)) {
    throw new Error("Invalid mode specified.");
  }

  try {
    const customerId = await findOrCreateStripeCustomer(user.id, user.email);

    // Define success and cancel URLs
    // Use NEXT_PUBLIC_APP_URL, fallback to referer header, then localhost
    const referer = (await headers()).get("referer");
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (referer ? new URL(referer).origin : null) || // Try to get origin from referer
      "http://localhost:3000"; // Fallback

    const successUrl = `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    // Use /pricing as cancel URL, ensuring it's absolute
    const cancelUrl = `${baseUrl}/pricing`;

    console.log(`Using Base URL: ${baseUrl}`);
    console.log(`Success URL: ${successUrl}`);
    console.log(`Cancel URL: ${cancelUrl}`);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: [{ price: priceId, quantity: quantity }],
      mode: mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      // metadata: { supabase_user_id: user.id }, // Optional: Add if needed for webhooks
    };

    const session = await createStripeCheckoutSession({
      stripe: stripe,
      params: sessionParams,
    });

    if (!session.url) {
      console.error("Checkout session URL was not returned by Stripe.");
      throw new Error("Checkout session URL is missing.");
    }

    console.log(
      `Successfully created checkout session ${session.id} for user ${user.id}`,
    );
    return { sessionId: session.id, url: session.url };
  } catch (error: unknown) {
    console.error("Error creating Stripe checkout session:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown server error occurred";
    // Re-throw the error to be caught by the client mutation's onError handler
    throw new Error(`Failed to create checkout session: ${errorMessage}`);
  }
}
