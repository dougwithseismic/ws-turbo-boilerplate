// Export core instances and functions
import { analytics, updateConsent } from "./index";

// Export components and hooks
export { AnalyticsProvider } from "./provider";
export { useAnalytics } from "./use-analytics";
export { ConsentManager, ConsentManagerButton } from "./consent-manager";

// Export utility functions
export {
  trackButtonClick,
  trackPageView,
  identifyUser,
  updateUserConsent,
  enableDebugMode,
} from "./test";

// Export core instances
export { analytics, updateConsent };
