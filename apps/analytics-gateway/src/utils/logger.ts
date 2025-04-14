import { createLogger, format, transports } from "winston";
import { SERVER_CONFIG } from "../config";

const logLevel = SERVER_CONFIG.IS_PRODUCTION ? "info" : "debug";

const logger = createLogger({
  level: logLevel,
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  defaultMeta: { service: "analytics-gateway" },
  transports: [
    // Write to all logs with level `info` and below to `combined.log`
    new transports.File({ filename: "logs/combined.log" }),
    // Write all logs error (and below) to `error.log`
    new transports.File({ filename: "logs/error.log", level: "error" }),
  ],
});

// If we're not in production then log to the console
if (SERVER_CONFIG.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`,
        ),
      ),
    }),
  );
}

export default logger;
