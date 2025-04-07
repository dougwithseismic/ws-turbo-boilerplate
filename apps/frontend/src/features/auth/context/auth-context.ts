"use client";

import { createContext } from "react";
import type { User } from "@supabase/supabase-js";
import type {
  LoadingState,
  AuthFormData,
  AuthResponseWithSession,
  AuthResponse,
} from "../types";

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loadingState: LoadingState;
  isAuthenticated: boolean;
  signIn: (data: AuthFormData) => Promise<AuthResponseWithSession>;
  signUp: (data: AuthFormData) => Promise<AuthResponseWithSession>;
  signOut: (options?: {
    redirect?: boolean;
    destinationUrl?: string;
  }) => Promise<AuthResponse>;
  resetPassword: (data: { email: string }) => Promise<AuthResponse>;
  updatePassword: (data: {
    currentPassword?: string;
    password: string;
  }) => Promise<AuthResponse>;
  signInWithProvider: (
    provider: "google" | "facebook" | "github",
  ) => Promise<{ data: string | null; error: Error | null }>;
}

export const AuthContext = createContext<AuthContextType>(
  {
    user: null,
    isLoading: true,
    loadingState: "idle",
    isAuthenticated: false,
    signIn: () => Promise.reject(new Error("AuthContext not initialized")),
    signUp: () => Promise.reject(new Error("AuthContext not initialized")),
    signOut: () => Promise.reject(new Error("AuthContext not initialized")),
    resetPassword: () =>
      Promise.reject(new Error("AuthContext not initialized")),
    updatePassword: () =>
      Promise.reject(new Error("AuthContext not initialized")),
    signInWithProvider: () =>
      Promise.reject(new Error("AuthContext not initialized")),
    // Add default stubs for other methods
  } as AuthContextType, // Cast to satisfy TS
);
