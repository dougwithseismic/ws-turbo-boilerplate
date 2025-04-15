export { Analytics } from "./analytics";
export type {
  Plugin,
  Middleware,
  AnalyticsEvent,
  PageView,
  Identity,
} from "./types";

export { ConsolePlugin, withConsole } from "./plugins/console";
export { LoggerMiddleware, withLogger } from "./middleware/logger";
export {
  ConsentModeMiddleware,
  withConsentMode,
} from "./middleware/consent-mode";
export type { ConsentModeState } from "./middleware/consent-mode";
