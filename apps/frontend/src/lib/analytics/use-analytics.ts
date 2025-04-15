"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { analytics } from "./index";

/**
 * React hook for using analytics in components
 */
export function useAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views automatically when URL changes
  useEffect(() => {
    // Combine pathname and searchParams to get the full path
    // Handle potential null initial value for searchParams if necessary
    const currentSearchParams = searchParams ? searchParams.toString() : "";
    const url = `${pathname}${currentSearchParams ? `?${currentSearchParams}` : ""}`;

    // Function to track page view (no longer needs url argument)
    const trackPageView = () => {
      analytics.page({
        path: url,
        title: typeof document !== "undefined" ? document.title : undefined,
        properties: {
          referrer:
            typeof document !== "undefined" ? document.referrer : undefined,
          url: typeof window !== "undefined" ? window.location.href : undefined,
        },
      });
    };

    // Track page view whenever pathname or searchParams change
    // Ensure pathname is available before tracking
    if (pathname) {
      trackPageView();
    }
  }, [pathname, searchParams]); // Depend on pathname and searchParams

  // Track custom event - using any for eventName to allow for custom event names
  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      analytics.track(eventName, properties);
    },
    [],
  );

  // Identify user
  const identifyUser = useCallback(
    (userId: string, traits?: Record<string, unknown>) => {
      analytics.identify(userId, traits);
    },
    [],
  );

  return {
    trackEvent,
    identifyUser,
    analytics,
  };
}

/**
 * Usage example:
 *
 * const MyComponent = () => {
 *   const { trackEvent } = useAnalytics();
 *
 *   const handleClick = () => {
 *     trackEvent('button_click', { button_id: 'submit' });
 *   };
 *
 *   return <button onClick={handleClick}>Click me</button>;
 * };
 */
