"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  AuthFormData,
  AuthResponse,
  AuthResponseWithSession,
  AuthSession,
} from "../types";
import {
  AuthError as SupabaseAuthError,
  Session,
  User,
} from "@supabase/supabase-js";

// Basic error handling structure
interface AuthError extends Error {
  code?: string;
}

// Refined handler specifically for actions returning user/session data
async function handleAuthSessionResponse(
  promise: Promise<{
    data: { user: User | null; session: Session | null };
    error: SupabaseAuthError | null;
  }>,
): Promise<AuthResponseWithSession> {
  try {
    const { data, error } = await promise;
    if (error) {
      console.error("Supabase Auth Error:", error.message);
      const customError: AuthError = new Error(error.message);
      customError.code = error.code;
      return { data: { user: null, session: null }, error: customError };
    }
    // Ensure the data structure matches AuthSession
    const sessionData: AuthSession = {
      user: data?.user ?? null,
      session: data?.session ?? null,
    };
    return { data: sessionData, error: null };
  } catch (e) {
    console.error("Unexpected Auth Action Error:", e);
    const error =
      e instanceof Error ? e : new Error("An unexpected error occurred");
    return { data: { user: null, session: null }, error };
  }
}

export const executeSignIn = async (
  data: AuthFormData,
): Promise<AuthResponseWithSession> => {
  const supabase = await createSupabaseServerClient();
  return handleAuthSessionResponse(
    supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    }),
  );
};

export const executeSignUp = async (
  data: AuthFormData,
): Promise<AuthResponseWithSession> => {
  const supabase = await createSupabaseServerClient();
  // Ensure options.data structure matches your profiles table or requirements
  const options = data.fullName ? { data: { full_name: data.fullName } } : {};

  return handleAuthSessionResponse(
    supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: options,
    }),
  );
};

export const executeSignOut = async (): Promise<AuthResponse> => {
  const supabase = await createSupabaseServerClient();
  // SignOut doesn't return session/user data, so we handle it slightly differently
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Supabase SignOut Error:", error.message);
    const customError: AuthError = new Error(error.message);
    customError.code = error.code;
    return { data: null, error: customError };
  }
  return { data: null, error: null };
};

// Add executeResetPassword, executeUpdatePassword etc. here following the same pattern
export const executeResetPassword = async (data: {
  email: string;
}): Promise<AuthResponse> => {
  const supabase = await createSupabaseServerClient();
  // Note: You'll need to configure the redirect URL in your Supabase project settings
  // or provide it dynamically if needed.
  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/update-password`, // Example redirect URL
  });

  if (error) {
    console.error("Supabase Reset Password Error:", error.message);
    const customError: AuthError = new Error(error.message);
    customError.code = error.code;
    return { data: null, error: customError };
  }
  return { data: null, error: null }; // Success typically means email sent, no data returned
};

export const executeUpdatePassword = async (data: {
  password: string;
}): Promise<AuthResponseWithSession> => {
  const supabase = await createSupabaseServerClient();
  // This function updates the password for the currently logged-in user.

  const { data: updateData, error: updateError } =
    await supabase.auth.updateUser({
      password: data.password,
    });

  if (updateError) {
    console.error("Supabase Update Password Error:", updateError.message);
    const customError: AuthError = new Error(updateError.message);
    customError.code = updateError.code;
    return { data: { user: null, session: null }, error: customError };
  }

  // After successful password update, fetch the current session to return
  // consistent data structure, although updateUser itself only returns the user.
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    console.error(
      "Supabase Get Session Error after update:",
      sessionError.message,
    );
    // Decide how to handle this - maybe return success but without session?
    // For now, let's return the error.
    const customError: AuthError = new Error(sessionError.message);
    customError.code = sessionError.code;
    return { data: { user: null, session: null }, error: customError };
  }

  // Ensure the data structure matches AuthSession
  const responseData: AuthSession = {
    // Use the user returned by updateUser, as getSession might not immediately reflect the change
    // depending on Supabase internals, but the user object *is* updated.
    user: updateData?.user ?? null,
    session: sessionData?.session ?? null,
  };

  return { data: responseData, error: null };
};
