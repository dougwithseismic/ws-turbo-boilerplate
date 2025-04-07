"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  AuthFormData,
  AuthResponse,
  AuthResponseWithSession,
  AuthSession,
  AuthError,
} from "../types";
import {
  AuthError as SupabaseAuthError,
  Session,
  User,
} from "@supabase/supabase-js";

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
  const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?next=/dashboard`;

  // Properly type the options object to include both data and emailRedirectTo
  const options: {
    data?: { full_name: string };
    emailRedirectTo?: string;
  } = {};

  if (data.fullName) {
    options.data = { full_name: data.fullName };
  }

  // Fix linter error by ensuring redirectUrl is a string
  options.emailRedirectTo = redirectUrl || "";

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
  const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?next=/account/update-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: redirectUrl,
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
  currentPassword?: string;
  password: string;
}): Promise<AuthResponse> => {
  const supabase = await createSupabaseServerClient();

  if (data.currentPassword) {
    // Get current user's email
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.email) {
      const customError: AuthError = new Error(
        "Unable to verify current password: user email not found",
      );
      customError.code = "user_not_found";
      return { data: null, error: customError };
    }

    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: data.currentPassword,
    });

    if (signInError) {
      const customError: AuthError = new Error("Current password is incorrect");
      customError.code = "invalid_credentials";
      return { data: null, error: customError };
    }
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: data.password,
  });

  if (updateError) {
    console.error("Supabase Update Password Error:", updateError.message);
    const customError: AuthError = new Error(updateError.message);
    customError.code = updateError.code;
    return { data: null, error: customError };
  }

  return { data: null, error: null };
};

// Add OAuth provider sign-in capability
export const executeOAuthSignIn = async (
  provider: "google" | "facebook" | "github",
): Promise<{ data: string | null; error: AuthError | null }> => {
  const supabase = await createSupabaseServerClient();
  const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?next=/dashboard`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl || "",
    },
  });

  if (error) {
    console.error(`Supabase ${provider} Sign In Error:`, error.message);
    const customError: AuthError = new Error(error.message);
    customError.code = error.code;
    return { data: null, error: customError };
  }

  return { data: data.url, error: null };
};
