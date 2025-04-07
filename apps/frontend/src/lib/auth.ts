import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Get the current authenticated user session
 * @example
 * ```ts
 * const user = await auth()
 * if (user) {
 *   console.log('Authenticated user:', user)
 * } else {
 *   console.log('Not authenticated')
 * }
 * ```
 * @returns {Promise<User | null>} The authenticated user or null
 */
export const auth = cache(async (): Promise<User | null> => {
  const supabase = await createSupabaseServerClient();
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Auth error getting user:", error.message);
      return null;
    }

    return user;
  } catch (error) {
    console.error("Unexpected auth error:", error);
    return null;
  }
});

/**
 * Middleware to protect routes from unauthenticated access
 * Redirects to the specified path (default: '/login') if not authenticated.
 * @example
 * ```ts
 * // In a route handler or page
 * const user = await protectedRoute()
 * // If we get here, we have an authenticated user
 * console.log('Authenticated user:', user)
 * ```
 * @param {string} [redirectTo='/login'] - The path to redirect to if not authenticated.
 * @returns {Promise<User>} The authenticated user
 * @throws {Redirect} Redirects if not authenticated
 */
export const protectedRoute = async (redirectTo = "/login"): Promise<User> => {
  const user = await auth();

  if (!user) {
    redirect(redirectTo);
  }

  return user;
};
