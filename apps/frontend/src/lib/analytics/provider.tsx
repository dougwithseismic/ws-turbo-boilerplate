"use client";

import { ReactNode, useEffect } from "react";
import { analytics, updateConsent } from "./index";
import { useAnalytics } from "./use-analytics";

interface AnalyticsProviderProps {
  children: ReactNode;
  defaultConsent?: {
    analytics_storage?: boolean;
    ad_storage?: boolean;
    functionality_storage?: boolean;
    personalization_storage?: boolean;
    social_storage?: boolean;
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
      // Convert boolean values to consent mode strings
      updateConsent(
        Object.fromEntries(
          Object.entries(defaultConsent).map(([k, v]) => [
            k,
            v ? "granted" : "denied",
          ]),
        ),
      );
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
