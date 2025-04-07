"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AuthContext, type AuthContextType } from "../context/auth-context";
import { supabaseClient } from "@/lib/supabase/client";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import type {
  LoadingState,
  AuthFormData,
  AuthResponse,
  AuthResponseWithSession,
} from "../types";
import {
  executeSignIn,
  executeSignUp,
  executeSignOut,
  executeResetPassword,
  executeUpdatePassword,
  executeOAuthSignIn,
} from "../actions/auth-actions";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const router = useRouter();

  useEffect(() => {
    const getInitialSession = async () => {
      setIsLoading(true);
      try {
        // Check if session exists first
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (error) {
        console.error("Error getting initial session:", error);
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);
        setLoadingState("idle");
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Define action wrappers
  const signIn = useCallback(
    async (data: AuthFormData): Promise<AuthResponseWithSession> => {
      setLoadingState("progress");
      try {
        const response = await executeSignIn(data);
        setLoadingState(response.error ? "error" : "complete");
        if (!response.error) {
          router.push("/dashboard");
        }
        return response;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const signUp = useCallback(
    async (data: AuthFormData): Promise<AuthResponseWithSession> => {
      setLoadingState("progress");
      try {
        const response = await executeSignUp(data);
        setLoadingState(response.error ? "error" : "complete");
        if (!response.error) {
          const verifyParams = new URLSearchParams({
            email: encodeURIComponent(data.email),
            type: "signup",
          });
          router.push(`/auth/verify-request?${verifyParams.toString()}`);
        }
        return response;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const signOut = useCallback(
    async (options?: {
      redirect?: boolean;
      destinationUrl?: string;
    }): Promise<AuthResponse> => {
      setLoadingState("progress");
      try {
        const result = await executeSignOut();
        setLoadingState(result.error ? "error" : "complete");
        if (!result.error && options?.redirect) {
          router.push(options.destinationUrl || "/login");
        }
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const resetPassword = useCallback(
    async ({ email }: { email: string }): Promise<AuthResponse> => {
      setLoadingState("progress");
      try {
        const response = await executeResetPassword({ email });
        setLoadingState(response.error ? "error" : "complete");
        return response;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const updatePassword = useCallback(
    async ({
      currentPassword,
      password,
    }: {
      currentPassword?: string;
      password: string;
    }): Promise<AuthResponse> => {
      setLoadingState("progress");
      try {
        const response = await executeUpdatePassword({
          currentPassword,
          password,
        });
        setLoadingState(response.error ? "error" : "complete");
        if (!response.error) {
          router.push("/dashboard");
        }
        return response;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const signInWithProvider = useCallback(
    async (
      provider: "google" | "facebook" | "github",
    ): Promise<{ data: string | null; error: Error | null }> => {
      setLoadingState("progress");
      try {
        const response = await executeOAuthSignIn(provider);
        setLoadingState(response.error ? "error" : "complete");

        // If successful, we'll get back a URL to redirect to
        if (!response.error && response.data) {
          // For OAuth sign-in, we redirect the user to the provider's auth page
          window.location.href = response.data;
        }

        return response;
      } catch (error) {
        console.error(`Failed to sign in with ${provider}:`, error);
        setLoadingState("error");
        const err =
          error instanceof Error
            ? error
            : new Error(`Failed to sign in with ${provider}`);
        return { data: null, error: err };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const value: AuthContextType = useMemo(
    () => ({
      user,
      isLoading,
      loadingState,
      isAuthenticated: !!user,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      signInWithProvider,
    }),
    [
      user,
      isLoading,
      loadingState,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      signInWithProvider,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
