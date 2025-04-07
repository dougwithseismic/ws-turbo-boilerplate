import { config } from "dotenv";

config();
// Helper function to parse comma-separated strings into Sets
const parseCommaSeparatedList = (value: string): Set<string> =>
  new Set(value.split(",").map((item) => item.trim()));

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
  PORT: parseInt(process.env.PORT || "3000", 10),
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
  ALLOWED_DOMAINS: parseCommaSeparatedList(
    process.env.ALLOWED_DOMAINS || "localhost:3000,localhost:5173",
  ),
  WHITELISTED_IPS: parseCommaSeparatedList(
    process.env.WHITELISTED_IPS || "127.0.0.1,::1,::ffff:127.0.0.1,0.0.0.0",
  ),
};

// Redis configuration
export const REDIS_CONFIG = {
  CONNECTION_URL: process.env.BULLMQ_REDIS_URL,
  PREFIX: process.env.REDIS_PREFIX || "zer0:",
};
