import winston from "winston";
import { SERVER_CONFIG } from "../config";

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Custom console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  }),
);

// Create the logger instance
const logger = winston.createLogger({
  level: SERVER_CONFIG.IS_PRODUCTION ? "info" : "debug",
  format: logFormat,
  defaultMeta: { service: "zer0-backend" },
  transports: [
    // Write all logs with importance level of 'error' or less to 'error.log'
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      dirname: "logs",
      maxsize: 10000000, // 10MB
      maxFiles: 5,
    }),
    // Write all logs with importance level of 'info' or less to 'combined.log'
    new winston.transports.File({
      filename: "logs/combined.log",
      dirname: "logs",
      maxsize: 10000000, // 10MB
      maxFiles: 5,
    }),
  ],
  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: "logs/exceptions.log",
      dirname: "logs",
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: "logs/rejections.log",
      dirname: "logs",
    }),
  ],
});

// If we're not in production, log to the console with colors
if (!SERVER_CONFIG.IS_PRODUCTION) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      stderrLevels: ["error"], // Ensure errors go to stderr
      consoleWarnLevels: ["warn"], // Ensure warnings go to stderr
    }),
  );
}

// Preserve native console.log functionality
const originalConsoleLog = console.log;
console.log = (...args) => {
  originalConsoleLog.apply(console, args);
};

// Create a stream object for Morgan integration
export const logStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
