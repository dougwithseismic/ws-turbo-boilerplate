import type { Middleware } from "../types";

export class LoggerMiddleware implements Middleware {
  name = "logger";

  async process(
    method: "track" | "page" | "identify",
    data: any,
    next: (data: any) => Promise<void>,
  ): Promise<void> {
    console.log(`[Analytics2][Middleware] ${method}:`, data);
    await next(data);
  }
}

export function withLogger(): Middleware {
  return new LoggerMiddleware();
}
