import {
  Analytics,
  createBatchMiddleware,
  createConsentMiddleware,
  createValidationMiddleware,
  withPrivacy,
  createSessionMiddleware,
  ConsolePlugin,
  DebugPlugin,
  GoogleTagManagerPlugin,
} from "@zer0/analytics";

// Create analytics instance with all plugins configured
export const analytics = new Analytics({
  plugins: [
    // Debug plugin for development environments
    new DebugPlugin(),
    // Console plugin for logging events to console
    new ConsolePlugin({
      enabled: process.env.NODE_ENV !== "production",
    }),
    // GTM plugin for production analytics
    new GoogleTagManagerPlugin({
      containerId: process.env.NEXT_PUBLIC_GTM_ID || "GTM-EXAMPLE",
    }),
  ],
  middleware: [
    // Add validation to ensure events are properly structured
    createValidationMiddleware({
      strict: process.env.NODE_ENV === "development",
    }),
    // Add consent management
    createConsentMiddleware({
      requiredCategories: ["analytics"],
      defaultPreferences: {
        necessary: true,
        functional: true,
        analytics: false,
        advertising: false,
        social: false,
      },
    }),
    // Add session tracking
    createSessionMiddleware({
      trackSessionEvents: true,
    }),
    // Add privacy protection
    withPrivacy({
      sensitiveFields: ["password", "email"],
      hashFields: ["userId", "email"],
    }),
    // Add batch processing for performance
    createBatchMiddleware({
      maxSize: 10,
      maxWait: 2000,
      flushOnUnload: true,
    }),
  ],
  debug: process.env.NODE_ENV !== "production",
});

// Initialize analytics
analytics.initialize().catch(console.error);

// Helper methods
export const updateConsent = (preferences: {
  functional?: boolean;
  analytics?: boolean;
  advertising?: boolean;
  social?: boolean;
}) => {
  // Find the consent middleware by name
  const middleware = analytics.plugins.find((m) => m.name === "consent");
  if (middleware && typeof (middleware as any).updateConsent === "function") {
    return (middleware as any).updateConsent(preferences);
  }
  return false;
};

// Export configured instance
export default analytics;
