// Export core instances and functions
export { analytics, updateConsent } from "./index";

// (Optional) Export hooks/components if you want to keep them, or update as needed
export { AnalyticsProvider } from "./provider";
export { useAnalytics } from "./use-analytics";
export { ConsentManager, ConsentManagerButton } from "./consent-manager";

// Export utility functions (update as needed for new API)
export {
  trackButtonClick,
  trackPageView,
  identifyUser,
  updateUserConsent,
  enableDebugMode,
} from "./test";
