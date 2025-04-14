import type {
  Plugin,
  EventName,
  AnalyticsEvent,
  PageView,
  Identity,
} from "../types";

/**
 * Server-side analytics plugin that can be used with Next.js Server Components
 * and Server Actions.
 */
export class ServerPlugin implements Plugin {
  name = "server";
  private enabled: boolean;
  private serverLogger: (event: Record<string, unknown>) => Promise<void>;

  constructor(
    options: {
      enabled?: boolean;
      /**
       * Custom server-side logger function to send events to analytics systems.
       * You can implement this to send events to your analytics backend directly.
       */
      serverLogger?: (event: Record<string, unknown>) => Promise<void>;
    } = {},
  ) {
    this.enabled = options.enabled ?? true;
    this.serverLogger = options.serverLogger || this.defaultServerLogger;
  }

  private async defaultServerLogger(
    event: Record<string, unknown>,
  ): Promise<void> {
    // Default implementation for logging events on server
    // This can be replaced with proper server-side logging
    console.log("[Server Analytics]", event);
  }

  async initialize(): Promise<void> {
    if (!this.enabled) return;

    // Server plugins don't need to load external scripts
    return Promise.resolve();
  }

  async track<T extends EventName>(event: AnalyticsEvent<T>): Promise<void> {
    if (!this.enabled) return;

    await this.serverLogger({
      type: "track",
      name: event.name,
      properties: event.properties,
      timestamp: event.timestamp || Date.now(),
    });
  }

  async page(pageView: PageView): Promise<void> {
    if (!this.enabled) return;

    await this.serverLogger({
      type: "page",
      path: pageView.path,
      title: pageView.title,
      referrer: pageView.referrer,
      properties: pageView.properties,
      timestamp: pageView.timestamp || Date.now(),
    });
  }

  async identify(identity: Identity): Promise<void> {
    if (!this.enabled) return;

    await this.serverLogger({
      type: "identify",
      userId: identity.userId,
      traits: identity.traits,
      timestamp: identity.timestamp || Date.now(),
    });
  }

  loaded(): boolean {
    // Server plugins are always "loaded" since they don't need to load external scripts
    return true;
  }
}

/**
 * Creates a ServerPlugin instance for server-side analytics
 */
export function withServer(options?: {
  enabled?: boolean;
  serverLogger?: (event: Record<string, unknown>) => Promise<void>;
}): Plugin {
  return new ServerPlugin(options);
}
