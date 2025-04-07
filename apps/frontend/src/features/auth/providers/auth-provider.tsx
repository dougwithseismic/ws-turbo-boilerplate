"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
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
} from "../actions/auth-actions";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");

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
      setLoadingState("loading");
      const result = await executeSignIn(data);
      setLoadingState(result.error ? "error" : "success");
      return result;
    },
    [],
  );

  const signUp = useCallback(
    async (data: AuthFormData): Promise<AuthResponseWithSession> => {
      setLoadingState("loading");
      const result = await executeSignUp(data);
      setLoadingState(result.error ? "error" : "success");
      return result;
    },
    [],
  );

  const signOut = useCallback(
    async (options?: {
      redirect?: boolean;
      destinationUrl?: string;
    }): Promise<AuthResponse> => {
      setLoadingState("loading");
      const result = await executeSignOut();
      setLoadingState(result.error ? "error" : "success");
      if (!result.error && options?.redirect) {
        // Prefer server-side redirects or Next.js router for navigation
        // Using window.location.href might not be ideal in Next.js
        console.log(`Redirecting to ${options.destinationUrl || "/"}`);
        // Consider using router.push(options.destinationUrl || "/"); if using useRouter
      }
      return result;
    },
    [],
  );

  const value: AuthContextType = useMemo(
    () => ({
      user,
      // session, // Consider if session object needs to be exposed
      isLoading,
      loadingState,
      isAuthenticated: !!user,
      signIn,
      signUp,
      signOut,
    }),
    [user, isLoading, loadingState, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
