// Plugin interface
export interface Plugin {
  name: string;
  initialize?(): Promise<void>;
  track?(event: AnalyticsEvent): Promise<void>;
  page?(page: PageView): Promise<void>;
  identify?(identity: Identity): Promise<void>;
}

// Middleware interface
export interface Middleware {
  name: string;
  process(
    method: "track" | "page" | "identify",
    data: any,
    next: (data: any) => Promise<void>,
  ): Promise<void>;
}

// Event types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export interface PageView {
  path: string;
  title?: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export interface Identity {
  userId: string;
  traits?: Record<string, any>;
  timestamp?: number;
}
