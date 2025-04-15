import {
  Analytics,
  withConsole,
  withConsentMode,
  withLogger,
} from "@zer0/analytics-2";

// Create consent mode middleware instance
export const consentMode = withConsentMode();

// Create analytics instance
export const analytics = new Analytics({
  plugins: [withConsole()],
  middleware: [consentMode, withLogger()],
});

// Initialize analytics
analytics.initialize().catch(console.error);

// Helper to update consent
export function updateConsent(consent: {
  ad_storage?: "granted" | "denied";
  analytics_storage?: "granted" | "denied";
  functionality_storage?: "granted" | "denied";
  personalization_storage?: "granted" | "denied";
  security_storage?: "granted" | "denied";
  [key: string]: "granted" | "denied" | undefined;
}) {
  consentMode.setConsent(consent);
}

// Export configured instance
export default analytics;
