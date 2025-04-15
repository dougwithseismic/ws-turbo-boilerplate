import type { Middleware } from "../types";
import { nanoid } from "nanoid";

export type ConsentModeState = {
  ad_storage?: "granted" | "denied";
  analytics_storage?: "granted" | "denied";
  functionality_storage?: "granted" | "denied";
  personalization_storage?: "granted" | "denied";
  security_storage?: "granted" | "denied";
  [key: string]: "granted" | "denied" | undefined;
};

// Declare gtag on window for type safety
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const STORAGE_KEY = "analytics2_consent_mode";
const QUEUE_KEY = "analytics2_consent_queue";

type QueuedEvent = {
  id: string;
  method: "track" | "page" | "identify";
  data: any;
};

export class ConsentModeMiddleware implements Middleware {
  name = "consent-mode";
  private consent: ConsentModeState = {};
  private persist: boolean;
  private queue: QueuedEvent[] = [];
  private ready = false;

  constructor(options?: { persist?: boolean }) {
    this.persist = options?.persist ?? true;
    if (this.persist && typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          this.consent = JSON.parse(stored);
        } catch {}
      }
      const queueStored = localStorage.getItem(QUEUE_KEY);
      if (queueStored) {
        try {
          this.queue = JSON.parse(queueStored);
        } catch {}
      }
    }
  }

  setConsent(consent: ConsentModeState) {
    this.consent = { ...this.consent, ...consent };
    if (this.persist && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.consent));
    }
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("consent", "update", this.consent);
    }
    // If consent is now granted, replay queued events
    if (this.hasConsent()) {
      this.replayQueue();
    }
  }

  getConsent(): ConsentModeState {
    return { ...this.consent };
  }

  private hasConsent(): boolean {
    // Consider consent granted if ad_storage or analytics_storage is granted
    return (
      this.consent.ad_storage === "granted" ||
      this.consent.analytics_storage === "granted"
    );
  }

  private persistQueue() {
    if (this.persist && typeof window !== "undefined") {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    }
  }

  private async replayQueue() {
    // Only replay if consent is granted
    if (!this.hasConsent()) return;
    const queue = [...this.queue];
    this.queue = [];
    this.persistQueue();
    for (const event of queue) {
      if (typeof this._next === "function") {
        await this._next(event.data, event.method);
      }
    }
  }

  private _next:
    | ((data: any, method: "track" | "page" | "identify") => Promise<void>)
    | null = null;

  async process(
    method: "track" | "page" | "identify",
    data: any,
    next: (data: any) => Promise<void>,
  ): Promise<void> {
    // Assign a unique id to every event
    if (typeof data === "object" && data !== null) {
      data.__event_id = nanoid();
    }
    // If consent is not granted, queue the event
    if (!this.hasConsent()) {
      this.queue.push({ id: data.__event_id, method, data });
      this.persistQueue();
      // Save the next function for replay
      this._next = async (eventData, eventMethod) => {
        await next(eventData);
      };
      return;
    }
    await next(data);
  }
}

export function withConsentMode(options?: { persist?: boolean }) {
  return new ConsentModeMiddleware(options);
}
