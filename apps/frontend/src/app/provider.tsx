"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { AnalyticsProvider } from "../lib/analytics/provider";

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsProvider
        defaultConsent={{
          functional: true,
          // Default analytics consent is false - users must opt in
          analytics: false,
        }}
      >
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </AnalyticsProvider>
    </QueryClientProvider>
  );
}
