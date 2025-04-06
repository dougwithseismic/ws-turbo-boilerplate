import { Context, Next } from "hono";
import { supabase } from "../lib/supabase";
import logger from "../utils/logger";

export const authenticateUser = async (c: Context, next: Next) => {
  try {
    // Get the Authorization header
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json(
        {
          error: "Unauthorized",
          message: "Missing or invalid authorization token",
        },
        401,
      );
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    // Verify the token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn("Authentication failed", {
        error: error?.message || "No user found",
        path: c.req.path,
        method: c.req.method,
      });

      return c.json(
        {
          error: "Unauthorized",
          message: "Invalid or expired token",
        },
        401,
      );
    }

    // Add the verified user to the context for use in route handlers
    c.set("user", user);
    logger.debug("User authenticated", {
      userId: user.id,
      path: c.req.path,
      method: c.req.method,
    });

    await next();
  } catch (error) {
    logger.error("Authentication error", {
      error: error instanceof Error ? error.message : String(error),
      path: c.req.path,
      method: c.req.method,
    });

    return c.json(
      {
        error: "Authentication failed",
        message: "An error occurred during authentication",
      },
      500,
    );
  }
};

// Type declaration for the user in context
declare module "hono" {
  interface ContextVariableMap {
    user: {
      id: string;
      email?: string;
      [key: string]: any;
    };
  }
}
