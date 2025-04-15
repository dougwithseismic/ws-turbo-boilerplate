import type { Plugin, AnalyticsEvent, PageView, Identity } from "../types";

export class ConsolePlugin implements Plugin {
  name = "console";

  async initialize() {
    // No-op
  }

  async track(event: AnalyticsEvent) {
    console.log("[Analytics2] Track:", event);
  }

  async page(page: PageView) {
    console.log("[Analytics2] Page:", page);
  }

  async identify(identity: Identity) {
    console.log("[Analytics2] Identify:", identity);
  }
}

export function withConsole(): Plugin {
  return new ConsolePlugin();
}
