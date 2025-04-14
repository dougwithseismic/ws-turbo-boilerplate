import { analytics, updateConsent } from "./index";

/**
 * Example of tracking a custom event
 */
export function trackButtonClick(buttonId: string, buttonText: string) {
  analytics.track("button_click", {
    button_id: buttonId,
    button_text: buttonText,
    timestamp: Date.now(),
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
      referrer: document.referrer,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
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
 * Example of updating user consent
 */
export function updateUserConsent(allowAnalytics: boolean) {
  const updated = updateConsent({
    analytics: allowAnalytics,
    functional: true,
  });

  return updated;
}

/**
 * Helper to enable/disable debug mode
 */
export function enableDebugMode() {
  const consolePlugin = analytics.plugins.find((p) => p.name === "console");
  if (consolePlugin && typeof (consolePlugin as any).enable === "function") {
    (consolePlugin as any).enable();
  }
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
