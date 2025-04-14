import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { config } from "dotenv";
import { mkdirSync } from "fs";
import { rateLimiter } from "hono-rate-limiter";
import { cors } from "hono/cors";
import { RATE_LIMIT_CONFIG, SERVER_CONFIG } from "./config";
import logger from "./utils/logger";

// Import routes
import eventsRoutes from "./modules/events/events.routes";

config();

// Create logs directory if it doesn't exist
try {
  mkdirSync("logs");
} catch (error) {
  // Ignore error if directory already exists
}

// Set development mode when not in production
process.env.NODE_ENV = process.env.NODE_ENV || "development";

// Define the environment bindings type
interface Bindings {
  ip?: string;
}

const app = new OpenAPIHono<{ Bindings: Bindings }>();

// Middleware
app.use("*", cors());
app.use(
  "*",
  rateLimiter<{ Bindings: Bindings }>({
    windowMs: RATE_LIMIT_CONFIG.WINDOW_SIZE_MS,
    limit: RATE_LIMIT_CONFIG.MAX_REQUESTS,
    standardHeaders: "draft-6",
    keyGenerator: (c) => {
      return (
        c.req.header("x-forwarded-for")?.split(",")[0] ||
        c.req.header("x-real-ip") ||
        c.env?.ip ||
        "unknown"
      );
    },
  }),
);

// OpenAPI documentation setup
app.doc("/api-docs/openapi.json", {
  openapi: "3.0.0",
  info: {
    title: "Analytics Gateway API",
    version: "1.0.0",
    description: "API documentation for the Analytics Gateway service",
  },
  servers: [
    {
      url: `http://localhost:${SERVER_CONFIG.PORT}`,
      description: "Local development server",
    },
  ],
});

// Mount event routes
app.route("/v1", eventsRoutes);

// Routes
app.get("/", (c) => {
  logger.info("Health check request received");
  return c.json({
    message: "ANALYTICS.GATEWAY",
    status: "healthy",
  });
});

// Health check endpoint
app.get("/health", (c) => {
  logger.debug("Health check request received");
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.onError((err, c) => {
  console.error(err);
  logger.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
  });
  return c.json(
    {
      error: "Internal Server Error",
      message: SERVER_CONFIG.IS_PRODUCTION
        ? "An unexpected error occurred"
        : err.message,
    },
    500,
  );
});

let isShuttingDown = false;

// Start the server
const startServer = async () => {
  logger.info(
    `Server starting in ${SERVER_CONFIG.NODE_ENV} mode on port ${SERVER_CONFIG.PORT}`,
  );

  try {
    const server = serve({
      fetch: app.fetch,
      port: SERVER_CONFIG.PORT,
    });

    logger.info(`🚀 Server ready at http://localhost:${SERVER_CONFIG.PORT}`);
    logger.info(
      `📚 API Docs available at http://localhost:${SERVER_CONFIG.PORT}/api-docs/openapi.json`,
    );

    // Add shutdown handler
    const handleShutdown = async () => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      logger.info("Shutting down server...");

      // Close the server
      server.close((err) => {
        if (err) {
          logger.error("Error closing server:", err);
          process.exit(1); // Exit with error
        } else {
          logger.info("Server closed gracefully");
          process.exit(0); // Exit successfully
        }
      });

      // Force exit after a timeout if graceful shutdown fails
      setTimeout(() => {
        logger.warn("Graceful shutdown timed out, forcing exit.");
        process.exit(1);
      }, 10000); // 10 seconds timeout
    };

    process.on("SIGTERM", handleShutdown);
    process.on("SIGINT", handleShutdown);
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
