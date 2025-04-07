"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import getStripe from "@/lib/stripe/client";
import { createCheckoutSession } from "@/features/stripe/actions/checkout.actions"; // Use server action
import type { ProductWithPrice } from "@/features/stripe/actions/product.actions"; // Use type from server action

interface PricingClientProps {
  initialProducts: ProductWithPrice[];
  // You might want to pass initial error/loading state from the server component if needed
}

export function PricingClient({ initialProducts }: PricingClientProps) {
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Get products from React Query cache (hydrated by the server component)
  // We don't need useQuery here anymore if we trust the hydration
  // Alternatively, keep useQuery if you want background refetching
  const products =
    queryClient.getQueryData<ProductWithPrice[]>(["stripeProducts"]) ||
    initialProducts;

  const checkoutMutation = useMutation<
    { url: string },
    Error,
    { priceId: string; mode?: "payment" | "subscription" } // Update mutation args
  >({
    // Note: The server action itself handles quantity default
    mutationFn: createCheckoutSession, // Use the imported server action
    onSuccess: async (data) => {
      const stripe = await getStripe();
      if (!stripe || !data.url) {
        toast.error("Could not initiate checkout. Please try again.");
        setSelectedPriceId(null); // Reset on failure before redirect
        return;
      }
      // Redirect to Stripe Checkout
      console.log(`Redirecting to Stripe Checkout URL: ${data.url}`);
      window.location.href = data.url;
    },
    onError: (err) => {
      console.error("Checkout mutation failed:", err);
      toast.error(`Checkout failed: ${err.message}`);
      setSelectedPriceId(null); // Reset selection on error
    },
  });

  const handleCheckout = (priceId: string) => {
    console.log(`Initiating checkout for price ID: ${priceId}`);
    setSelectedPriceId(priceId);
    // Pass arguments as an object matching the server action
    checkoutMutation.mutate({ priceId: priceId, mode: "subscription" });
  };

  // Optional: Add loading/error states based on initial props or queryClient state if needed
  // if (isLoading) { ... }
  // if (error) { ... }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-center text-3xl font-bold">Choose Your Plan</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {products?.map((product) => (
          <Card key={product.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              {product.description && (
                <CardDescription>{product.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mb-4 text-2xl font-semibold">
                {(product.default_price.unit_amount! / 100).toLocaleString(
                  "en-US",
                  {
                    style: "currency",
                    currency: product.default_price.currency,
                  },
                )}
                <span className="text-sm font-normal text-muted-foreground">
                  /{product.default_price.recurring?.interval}
                </span>
              </div>
              {/* TODO: Replace placeholder features */}
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Feature A</li>
                <li>Feature B</li>
                <li>Feature C</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleCheckout(product.default_price.id)}
                disabled={
                  checkoutMutation.isPending &&
                  selectedPriceId === product.default_price.id
                }
                className="w-full"
              >
                {checkoutMutation.isPending &&
                selectedPriceId === product.default_price.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Choose Plan"
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}

        {/* Custom Plan Card */}
        <Card className="flex flex-col border-primary">
          <CardHeader>
            <CardTitle>Custom Plan</CardTitle>
            <CardDescription>
              Need a tailored solution? Let's discuss your specific
              requirements.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>Volume discounts</li>
              <li>Dedicated support</li>
              <li>Custom integrations</li>
              <li>And more...</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" variant="outline">
              <Link href="/contact">
                {" "}
                {/* Assuming /contact exists */}
                <Mail className="mr-2 h-4 w-4" /> Contact Us
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
