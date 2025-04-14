"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import analytics from "./index";

/**
 * React hook for using analytics in components
 */
export function useAnalytics() {
  const router = useRouter();

  // Track page views automatically when route changes
  useEffect(() => {
    if (!router) return;

    // Function to handle route changes
    const handleRouteChange = (url: string) => {
      analytics.page({
        path: url,
        title: document.title,
        properties: {
          referrer: document.referrer,
          url: window.location.href,
        },
      });
    };

    // Track initial page view
    handleRouteChange(router.asPath);

    // Add event listeners for route changes
    router.events.on("routeChangeComplete", handleRouteChange);

    // Clean up event listener
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router]);

  // Track custom event - using any for eventName to allow for custom event names
  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      analytics.track(eventName as any, properties);
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
