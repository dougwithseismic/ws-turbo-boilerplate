import { Context, Next } from "hono";
import { SECURITY_CONFIG, SERVER_CONFIG } from "../config";
import logger from "../utils/logger";

const isLocalhost = (ip: string): boolean => {
  // Check if the IP is in our whitelist
  if (SECURITY_CONFIG.WHITELISTED_IPS.has(ip)) return true;

  // Check for IPv4 localhost variations
  if (ip.startsWith("127.")) return true;

  // Check for IPv6 localhost
  if (ip.toLowerCase().startsWith("::ffff:127.")) return true;

  return false;
};

const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) return false;
  try {
    const hostname = new URL(origin).hostname;
    return SECURITY_CONFIG.ALLOWED_DOMAINS.has(hostname);
  } catch {
    // If URL parsing fails, check if the origin itself is in allowed domains
    return SECURITY_CONFIG.ALLOWED_DOMAINS.has(origin);
  }
};

export const ipWhitelist = async (c: Context, next: Next) => {
  // Allow all requests in development mode
  if (!SERVER_CONFIG.IS_PRODUCTION) {
    logger.debug("Development mode: IP whitelist check bypassed");
    await next();
    return;
  }

  const origin = c.req.header("origin");
  const clientIP =
    c.req.header("x-forwarded-for")?.split(",")[0] ||
    c.req.header("x-real-ip") ||
    c.env?.ip ||
    "unknown";

  // Log the request details at debug level
  logger.debug("Processing request", {
    ip: clientIP,
    origin: origin || "none",
    path: c.req.path,
    method: c.req.method,
    userAgent: c.req.header("user-agent"),
  });

  // In production, check both origin and IP
  if (!isAllowedOrigin(origin) && !isLocalhost(clientIP)) {
    logger.warn("Blocked unauthorized request", {
      ip: clientIP,
      origin: origin || "none",
      path: c.req.path,
      method: c.req.method,
      userAgent: c.req.header("user-agent"),
    });

    return c.json(
      {
        error: "Unauthorized",
        message: "Request origin not allowed",
        ip: clientIP,
        origin: origin || "none",
      },
      403,
    );
  }

  logger.debug("Request authorized", {
    ip: clientIP,
    origin: origin || "none",
  });

  await next();
};
