import type { Session, User } from "@supabase/supabase-js";

// Define AuthError locally since the external import has issues
export interface AuthError extends Error {
  code?: string;
}

export interface AuthResponse<T = null> {
  data: T;
  error: AuthError | Error | null; // Allow generic Error as well
}

export interface AuthSession {
  user: User | null;
  session: Session | null;
}

export type AuthResponseWithSession = AuthResponse<AuthSession>;
