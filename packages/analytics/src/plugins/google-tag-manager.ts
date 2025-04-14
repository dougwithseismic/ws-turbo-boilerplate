import type {
  Plugin,
  EventName,
  AnalyticsEvent,
  PageView,
  Identity,
} from "../types";
import { scriptLoader } from "../utils/script-loader";

type DataLayerObject = Record<string, unknown>;
type DataLayer = DataLayerObject[];

declare global {
  interface Window {
    [key: string]: unknown;
    dataLayer: DataLayer;
  }
}

export class GoogleTagManagerPlugin implements Plugin {
  name = "google-tag-manager";
  private containerId: string;
  private dataLayerName: string;
  private initialized = false;
  private dataLayer: DataLayer;
  private isClient = typeof window !== "undefined";

  constructor({
    containerId,
    dataLayerName = "dataLayer",
  }: {
    containerId: string;
    dataLayerName?: string;
  }) {
    this.containerId = containerId;
    this.dataLayerName = dataLayerName;
    this.dataLayer = [];
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Skip initialization on server-side
    if (!this.isClient) {
      return;
    }

    // Initialize dataLayer array if it doesn't exist
    window[this.dataLayerName] = window[this.dataLayerName] || [];
    this.dataLayer = window[this.dataLayerName] as DataLayer;

    // Load GTM script using script loader
    try {
      await scriptLoader.loadScript(
        `https://www.googletagmanager.com/gtm.js?id=${this.containerId}`,
        {
          id: `gtm-${this.containerId}`,
          async: true,
          retries: 2,
          retryDelay: 1000,
          cleanup: true,
        },
      );
      this.initialized = true;
    } catch (error) {
      this.initialized = false;
      console.error(
        `Failed to load Google Tag Manager script: ${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }

    // Push the GTM container ID to the dataLayer
    this.push({
      "gtm.start": new Date().getTime(),
      event: "gtm.js",
    });
  }

  private push(data: DataLayerObject): void {
    // Skip operations on server-side
    if (!this.isClient) return;

    this.dataLayer.push(data);
  }

  async track<T extends EventName>(event: AnalyticsEvent<T>): Promise<void> {
    // Skip operations on server-side
    if (!this.isClient) return;

    this.push({
      event: event.name,
      ...event.properties,
      timestamp: event.timestamp || Date.now(),
    });
  }

  async page(pageView: PageView): Promise<void> {
    // Skip operations on server-side
    if (!this.isClient) return;

    this.push({
      event: "page_view",
      page_path: pageView.path,
      page_title: pageView.title,
      page_referrer: pageView.referrer,
      ...pageView.properties,
      timestamp: pageView.timestamp || Date.now(),
    });
  }

  async identify(identity: Identity): Promise<void> {
    // Skip operations on server-side
    if (!this.isClient) return;

    this.push({
      event: "identify",
      user_id: identity.userId,
      ...identity.traits,
      timestamp: identity.timestamp || Date.now(),
    });
  }

  loaded(): boolean {
    // On server-side, report as not loaded
    if (!this.isClient) return false;

    return this.initialized;
  }
}

export function withGoogleTagManager(config: {
  containerId: string;
  dataLayerName?: string;
}): Plugin {
  return new GoogleTagManagerPlugin(config);
}
