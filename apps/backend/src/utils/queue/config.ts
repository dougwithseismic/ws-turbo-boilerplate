import { QueueOptions } from "bullmq";
import { REDIS_CONFIG } from "../../config";
import logger from "../logger";

// Create Redis connection config
export const redisConnection = REDIS_CONFIG.CONNECTION_URL
  ? { url: REDIS_CONFIG.CONNECTION_URL }
  : {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD,
    };

// Default queue options
export const defaultQueueOptions: QueueOptions = {
  connection: redisConnection,
  prefix: REDIS_CONFIG.PREFIX,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep only last 100 completed jobs
    removeOnFail: 200, // Keep only last 200 failed jobs
    attempts: 3, // Try 3 times before marking as failed
    backoff: {
      type: "exponential",
      delay: 1000, // Initial backoff delay in ms
    },
  },
};

// Log queue events (can be used with worker and queue instances)
export const attachLoggers = (instance: any, name: string) => {
  instance.on("error", (error: Error) => {
    logger.error(`Queue ${name} error:`, error);
  });

  // Add other event handlers as needed
  if (instance.on && typeof instance.on === "function") {
    instance.on("failed", (job: any, error: Error) => {
      logger.error(`Job ${job?.id} in queue ${name} failed:`, {
        error: error.message,
        stack: error.stack,
      });
    });
  }
};
