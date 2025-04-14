import { z } from "zod";

// Schema for event validation
export const EventSchema = z.object({
  id: z.string().uuid().describe("Unique identifier for the event"),
  payload: z.record(z.any()).describe("Any JSON payload for the event"),
  timestamp: z
    .string()
    .datetime()
    .optional()
    .describe("Timestamp of the event"),
});

// Type for events extracted from the schema
export type Event = z.infer<typeof EventSchema>;

// Response schema
export const EventResponseSchema = z.object({
  success: z.boolean().describe("Whether the event was processed successfully"),
  message: z.string().describe("Status message"),
  eventId: z.string().describe("The ID of the processed event"),
});

export type EventResponse = z.infer<typeof EventResponseSchema>;
