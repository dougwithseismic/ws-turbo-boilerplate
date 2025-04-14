import { describe, it, expect, vi, beforeEach, SpyInstance } from "vitest";
import { ServerPlugin, withServer } from "./server";
import type { AnalyticsEvent, PageView, Identity } from "../types";

describe("ServerPlugin", () => {
  let plugin: ServerPlugin;
  let mockServerLogger: SpyInstance;

  beforeEach(() => {
    mockServerLogger = vi.fn().mockResolvedValue(undefined);
    plugin = new ServerPlugin({
      serverLogger: mockServerLogger,
    });
  });

  describe("initialization", () => {
    it("should initialize without errors", async () => {
      await expect(plugin.initialize()).resolves.not.toThrow();
    });

    it("should be loaded by default", () => {
      expect(plugin.loaded()).toBe(true);
    });
  });

  describe("event tracking", () => {
    const timestamp = Date.now();

    it("should log track events to the server logger", async () => {
      const event: AnalyticsEvent = {
        name: "api_call",
        properties: { endpoint: "/api/data", status: 200 },
        timestamp,
      };

      await plugin.track(event);

      expect(mockServerLogger).toHaveBeenCalledWith({
        type: "track",
        name: event.name,
        properties: event.properties,
        timestamp,
      });
    });

    it("should log page views to the server logger", async () => {
      const pageView: PageView = {
        path: "/account",
        title: "Account Page",
        referrer: "https://example.com",
        properties: { section: "settings" },
        timestamp,
      };

      await plugin.page(pageView);

      expect(mockServerLogger).toHaveBeenCalledWith({
        type: "page",
        path: pageView.path,
        title: pageView.title,
        referrer: pageView.referrer,
        properties: pageView.properties,
        timestamp,
      });
    });

    it("should log identify calls to the server logger", async () => {
      const identity: Identity = {
        userId: "user123",
        traits: { plan: "premium", role: "admin" },
        timestamp,
      };

      await plugin.identify(identity);

      expect(mockServerLogger).toHaveBeenCalledWith({
        type: "identify",
        userId: identity.userId,
        traits: identity.traits,
        timestamp,
      });
    });

    it("should not log when disabled", async () => {
      plugin = new ServerPlugin({ enabled: false });

      const event: AnalyticsEvent = {
        name: "api_call",
        properties: { endpoint: "/api/data" },
        timestamp,
      };

      await plugin.track(event);
      expect(mockServerLogger).not.toHaveBeenCalled();
    });

    it("should use default logger if none provided", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      plugin = new ServerPlugin();

      const event: AnalyticsEvent = {
        name: "api_call",
        properties: { endpoint: "/api/data" },
        timestamp,
      };

      await plugin.track(event);
      expect(consoleSpy).toHaveBeenCalledWith(
        "[Server Analytics]",
        expect.objectContaining({
          type: "track",
          name: "api_call",
        }),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("factory function", () => {
    it("should create a new ServerPlugin instance", () => {
      const serverLogger = vi.fn();
      const plugin = withServer({ serverLogger });

      expect(plugin).toBeInstanceOf(ServerPlugin);
      expect(plugin.name).toBe("server");
    });
  });
});
