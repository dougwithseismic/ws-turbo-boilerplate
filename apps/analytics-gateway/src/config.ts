import { config } from "dotenv";

config();

// Helper to get required env var
const getRequiredEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

// Server configuration
export const SERVER_CONFIG = {
  PORT: parseInt(process.env.ANALYTICS_PORT || "3002", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  WINDOW_SIZE_MS:
    parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || "1", 10) * 60 * 1000,
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_CLIENT_REQUESTS || "100", 10),
};

// Security configuration
export const SECURITY_CONFIG = {
  ALLOWED_DOMAINS: process.env.ALLOWED_DOMAINS?.split(",").map((domain) =>
    domain.trim(),
  ) || ["localhost:3000", "localhost:5173"],
  WHITELISTED_IPS: process.env.WHITELISTED_IPS?.split(",").map((ip) =>
    ip.trim(),
  ) || ["127.0.0.1", "::1", "::ffff:127.0.0.1", "0.0.0.0"],
};
