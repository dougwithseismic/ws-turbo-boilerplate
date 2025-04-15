import type {
  Plugin,
  Middleware,
  AnalyticsEvent,
  PageView,
  Identity,
} from "./types";

export class Analytics {
  private plugins: Plugin[] = [];
  private middleware: Middleware[] = [];

  constructor(options?: { plugins?: Plugin[]; middleware?: Middleware[] }) {
    if (options?.plugins) this.plugins = [...options.plugins];
    if (options?.middleware) this.middleware = [...options.middleware];
  }

  use(plugin: Plugin) {
    this.remove(plugin.name);
    this.plugins.push(plugin);
  }

  remove(name: string) {
    this.plugins = this.plugins.filter((p) => p.name !== name);
  }

  useMiddleware(mw: Middleware) {
    this.middleware.push(mw);
  }

  async initialize() {
    await Promise.all(this.plugins.map((p) => p.initialize?.()));
  }

  private async runMiddleware(
    method: "track" | "page" | "identify",
    data: any,
    final: (data: any) => Promise<void>,
  ) {
    let idx = 0;
    const chain = async (d: any): Promise<void> => {
      const mw = this.middleware[idx++];
      if (mw && typeof mw.process === "function") {
        await mw.process(method, d, chain);
      } else {
        await final(d);
      }
    };
    await chain(data);
  }

  async track(name: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = { name, properties, timestamp: Date.now() };
    await this.runMiddleware("track", event, async (e) => {
      await Promise.all(this.plugins.map((p) => p.track?.(e)));
    });
  }

  async page(page: Omit<PageView, "timestamp">) {
    const fullPage: PageView = { ...page, timestamp: Date.now() };
    await this.runMiddleware("page", fullPage, async (p) => {
      await Promise.all(this.plugins.map((pl) => pl.page?.(p)));
    });
  }

  async identify(userId: string, traits?: Record<string, any>) {
    const identity: Identity = { userId, traits, timestamp: Date.now() };
    await this.runMiddleware("identify", identity, async (i) => {
      await Promise.all(this.plugins.map((p) => p.identify?.(i)));
    });
  }
}
