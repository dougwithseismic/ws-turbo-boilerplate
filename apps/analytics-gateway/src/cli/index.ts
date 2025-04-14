#!/usr/bin/env node
import { program } from "commander";
import { v4 as uuidv4 } from "uuid";
import { config } from "dotenv";
import logger from "../utils/logger";
import { SERVER_CONFIG } from "../config";

config();

// Define CLI program
program
  .name("analytics-cli")
  .description("CLI tool for interacting with the Analytics Gateway")
  .version("1.0.0");

// Command to send event
program
  .command("send-event")
  .description("Send an event to the Analytics Gateway")
  .option("-i, --id <id>", "Custom event ID (defaults to a generated UUID)")
  .option("-p, --payload <payload>", "JSON payload for the event (required)")
  .option(
    "-u, --url <url>",
    "URL of the analytics gateway",
    `http://localhost:${SERVER_CONFIG.PORT}/v1/events`,
  )
  .action(async (options) => {
    try {
      // Validate payload exists
      if (!options.payload) {
        console.error("Error: Payload is required");
        process.exit(1);
      }

      // Parse payload
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(options.payload);
      } catch (error) {
        console.error("Error: Invalid JSON payload");
        process.exit(1);
      }

      // Generate event ID if not provided
      const eventId = options.id || uuidv4();

      // Create event object
      const event = {
        id: eventId,
        payload: parsedPayload,
        timestamp: new Date().toISOString(),
      };

      console.log(`Sending event with ID: ${eventId} to ${options.url}`);

      // Send event to the gateway
      const response = await fetch(options.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });

      // Parse and display response
      const result = await response.json();

      if (response.ok) {
        console.log("✅ Event sent successfully!");
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error("❌ Failed to send event:");
        console.error(JSON.stringify(result, null, 2));
        process.exit(1);
      }
    } catch (error) {
      console.error("❌ Error:", (error as Error).message);
      process.exit(1);
    }
  });

// Command to generate a test event
program
  .command("generate-test")
  .description("Generate a test event with random data")
  .option(
    "-u, --url <url>",
    "URL of the analytics gateway",
    `http://localhost:${SERVER_CONFIG.PORT}/v1/events`,
  )
  .action(async (options) => {
    try {
      // Generate a random test event
      const event = {
        id: uuidv4(),
        payload: {
          type: "test-event",
          user: `user-${Math.floor(Math.random() * 1000)}`,
          action: "view",
          page: "/test-page",
          timestamp: Date.now(),
        },
        timestamp: new Date().toISOString(),
      };

      console.log(`Sending test event with ID: ${event.id} to ${options.url}`);

      // Send event to the gateway
      const response = await fetch(options.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });

      // Parse and display response
      const result = await response.json();

      if (response.ok) {
        console.log("✅ Test event sent successfully!");
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error("❌ Failed to send test event:");
        console.error(JSON.stringify(result, null, 2));
        process.exit(1);
      }
    } catch (error) {
      console.error("❌ Error:", (error as Error).message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);
