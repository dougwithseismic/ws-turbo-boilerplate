import type { AuthError } from "@/lib/errors"; // Assuming error handling structure
import type { Session, User } from "@supabase/supabase-js";

export interface AuthResponse<T = null> {
  data: T;
  error: AuthError | Error | null; // Allow generic Error as well
}

export interface AuthSession {
  user: User | null;
  session: Session | null;
}

export type AuthResponseWithSession = AuthResponse<AuthSession>;
