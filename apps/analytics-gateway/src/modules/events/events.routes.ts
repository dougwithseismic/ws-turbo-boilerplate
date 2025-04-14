import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { EventSchema, EventResponseSchema } from "../../types/events";
import logger from "../../utils/logger";

// Create a router for events
const router = new OpenAPIHono();

// Define route for receiving events
const postEventRoute = createRoute({
  method: "post",
  path: "/events",
  request: {
    body: {
      content: {
        "application/json": {
          schema: EventSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: EventResponseSchema,
        },
      },
      description: "Event successfully received",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
      description: "Invalid event payload",
    },
  },
});

// Implement the route handler
router.openapi(postEventRoute, async (c) => {
  try {
    const event = await c.req.json();

    // Add timestamp if not present
    if (!event.timestamp) {
      event.timestamp = new Date().toISOString();
    }

    // Log the received event
    logger.info("Event received", { eventId: event.id });

    // Here you would typically process the event
    // For example, store it in a database or forward to a queue

    return c.json({
      success: true,
      message: "Event received successfully",
      eventId: event.id,
    });
  } catch (error) {
    logger.error("Error processing event", { error: (error as Error).message });
    return c.json(
      {
        success: false,
        message: "Error processing event: " + (error as Error).message,
      },
      400,
    );
  }
});

export default router;
