import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { fetchStripeProducts } from "@/features/stripe/actions/product.actions";
import { PricingClient } from "@/features/pages/pricing/page.client";
import { protectedRoute } from "@/lib/auth";

// This page is now a Server Component by default

export default async function PricingPage() {
  const queryClient = new QueryClient();

  await protectedRoute("/login");
  // Prefetch products data on the server
  // Handle potential errors during server-side fetching
  try {
    await queryClient.prefetchQuery({
      queryKey: ["stripeProducts"],
      queryFn: fetchStripeProducts,
    });
  } catch (error) {
    console.error("Failed to prefetch Stripe products:", error);
    // Render an error state or fallback UI
    // Note: The client component also handles errors, but this catches server-side fetch issues.
    return (
      <div className="flex h-screen items-center justify-center text-destructive">
        Error loading plans. Please try refreshing the page.
        {/* Optionally display error details in development */}
        {process.env.NODE_ENV === "development" && (
          <pre className="mt-4 whitespace-pre-wrap text-xs">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        )}
      </div>
    );
  }

  // Get the prefetched data to pass as initialData to the client component
  // This avoids a flash of loading state on the client if hydration works correctly
  const initialProducts =
    queryClient.getQueryData<Awaited<ReturnType<typeof fetchStripeProducts>>>([
      "stripeProducts",
    ]) || [];

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PricingClient initialProducts={initialProducts} />
    </HydrationBoundary>
  );
}
