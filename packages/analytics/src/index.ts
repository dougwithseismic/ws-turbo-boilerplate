// Core exports
export { Analytics } from "./core/analytics";
export { createAnalytics } from "./core/create-analytics";
export type { PluginMethodData } from "./core/analytics";

// Plugin exports
export {
  DebugPlugin,
  withDebug,
  ConsolePlugin,
  GoogleTagManagerPlugin,
  withGoogleTagManager,
  ServerPlugin,
  withServer,
} from "./plugins";

// Middleware exports
export {
  ValidationMiddleware,
  createValidationMiddleware,
} from "./middleware/validation";
export type { ValidationOptions } from "./middleware/validation";

export { BatchMiddleware, createBatchMiddleware } from "./middleware/batch";
export type { BatchOptions } from "./middleware/batch";

export {
  ConsentMiddleware,
  createConsentMiddleware,
} from "./middleware/consent";
export type { ConsentCategory, ConsentPreferences } from "./middleware/consent";

export {
  SessionMiddleware,
  createSessionMiddleware,
} from "./middleware/session";
export type { WithSession } from "./middleware/session";

export { PrivacyMiddleware, withPrivacy } from "./middleware/privacy";
export type { PrivacyOptions } from "./middleware/privacy";

export { createSessionStore } from "./middleware/session-store";
export type {
  SessionStore,
  SessionData,
  SessionStoreConfig,
} from "./middleware/session-store";

// Storage exports
export {
  LocalStorageAdapter,
  MemoryStorageAdapter,
} from "./middleware/storage";
export type { StorageAdapter } from "./middleware/storage";

// Type exports
export type {
  AnalyticsEvent,
  AnalyticsOptions,
  Identity,
  PageView,
  Plugin,
  EventName,
  BaseProperties,
  EventProperties,
} from "./types";
