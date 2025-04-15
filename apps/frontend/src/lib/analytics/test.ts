import { analytics, updateConsent } from "./index";

/**
 * Example of tracking a custom event
 */
export function trackButtonClick(buttonId: string, buttonText: string) {
  analytics.track("button_click", {
    button_id: buttonId,
    button_text: buttonText,
  });
}

/**
 * Example of tracking a page view
 */
export function trackPageView(path: string, title: string) {
  analytics.page({
    path,
    title,
    properties: {
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
      viewport_width:
        typeof window !== "undefined" ? window.innerWidth : undefined,
      viewport_height:
        typeof window !== "undefined" ? window.innerHeight : undefined,
    },
  });
}

/**
 * Example of identifying a user
 */
export function identifyUser(userId: string, email: string, name: string) {
  analytics.identify(userId, {
    email,
    name,
    signup_date: new Date().toISOString(),
  });
}

/**
 * Example of updating user consent (now uses consent mode)
 */
export function updateUserConsent(allowAnalytics: boolean) {
  updateConsent({
    analytics_storage: allowAnalytics ? "granted" : "denied",
    ad_storage: "denied",
    functionality_storage: "granted",
    personalization_storage: "denied",
    security_storage: "granted",
  });
}

/**
 * Helper to enable/disable debug mode (noop for now)
 */
export function enableDebugMode() {
  // No-op: Console plugin is always enabled in this setup
}

/**
 * Example usage
 */
function exampleUsage() {
  // Enable consent first
  updateUserConsent(true);

  // Track page view
  trackPageView("/home", "Home Page");

  // Identify user when they log in
  identifyUser("user-123", "user@example.com", "John Doe");

  // Track specific events
  trackButtonClick("signup-btn", "Sign Up Now");
}
