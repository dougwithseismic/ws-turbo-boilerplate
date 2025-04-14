import { Analytics } from "./analytics";
import type { Plugin } from "../types";
import { withServer } from "../plugins/server";

export interface CreateAnalyticsOptions {
  /** Client-side plugins to use in browser environments */
  clientPlugins?: Plugin[];
  /** Server-side plugins to use in server environments */
  serverPlugins?: Plugin[];
  /** Additional plugins to use in both environments */
  commonPlugins?: Plugin[];
  /** Whether to apply automatic environment detection */
  autoDetectEnvironment?: boolean;
  /** Force a specific environment */
  environment?: {
    isServer?: boolean;
    isClient?: boolean;
  };
  /** Whether to enable debug mode */
  debug?: boolean;
}

/**
 * Detects the current environment
 */
function detectEnvironment(config?: {
  isServer?: boolean;
  isClient?: boolean;
}) {
  if (config) {
    return {
      isServer: config.isServer ?? false,
      isClient: config.isClient ?? false,
    };
  }

  // Default environment detection
  const isClient = typeof window !== "undefined";
  const isServer = !isClient;

  return {
    isServer,
    isClient,
  };
}

/**
 * Creates an analytics instance with the appropriate plugins based on environment.
 *
 * @example
 * ```typescript
 * // Create analytics with environment-specific plugins
 * const analytics = createAnalytics({
 *   clientPlugins: [
 *     withGoogleTagManager({ containerId: 'GTM-XXXX' }),
 *     withDebug()
 *   ],
 *   serverPlugins: [
 *     withServer({
 *       serverLogger: async (event) => {
 *         // Send to your analytics backend
 *         await fetch('/api/analytics', {
 *           method: 'POST',
 *           body: JSON.stringify(event)
 *         });
 *       }
 *     })
 *   ],
 *   commonPlugins: [
 *     withValidation()
 *   ],
 *   debug: true
 * });
 * ```
 */
export function createAnalytics(
  options: CreateAnalyticsOptions = {},
): Analytics {
  const env = detectEnvironment(options.environment);
  const plugins: Plugin[] = [...(options.commonPlugins || [])];

  if (env.isClient) {
    plugins.push(...(options.clientPlugins || []));
  } else if (env.isServer) {
    // Add default server plugin if none provided
    if (!options.serverPlugins || options.serverPlugins.length === 0) {
      plugins.push(withServer());
    } else {
      plugins.push(...options.serverPlugins);
    }
  }

  return new Analytics({
    plugins,
    debug: options.debug,
  });
}
