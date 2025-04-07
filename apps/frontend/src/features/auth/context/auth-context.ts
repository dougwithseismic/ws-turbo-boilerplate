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
  // Add other methods like resetPassword, updatePassword as needed
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
    // Add default stubs for other methods
  } as AuthContextType, // Cast to satisfy TS
);
