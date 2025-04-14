"use client";

import { ReactNode, useEffect } from "react";
import { analytics, updateConsent } from "./index";
import { useAnalytics } from "./use-analytics";

interface AnalyticsProviderProps {
  children: ReactNode;
  defaultConsent?: {
    analytics?: boolean;
    functional?: boolean;
    advertising?: boolean;
    social?: boolean;
  };
}

/**
 * Provider component that initializes analytics and sets up page tracking
 */
export function AnalyticsProvider({
  children,
  defaultConsent,
}: AnalyticsProviderProps) {
  // Initialize analytics
  useEffect(() => {
    // Initialize the analytics instance
    analytics.initialize().catch(console.error);

    // Apply default consent settings if provided
    if (defaultConsent) {
      updateConsent(defaultConsent);
    }

    // Clean up on unmount (not typically needed for analytics)
    return () => {
      // Any cleanup if needed
    };
  }, [defaultConsent]);

  // Use the analytics hook to set up page tracking
  useAnalytics();

  return <>{children}</>;
}

/**
 * Helper to manually update consent settings
 */
export { updateConsent };
