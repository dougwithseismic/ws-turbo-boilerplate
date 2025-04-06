import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

export type SupabaseInstance = SupabaseClient<Database>;

export interface SupabaseConfig {
  supabase: SupabaseInstance;
}

// Generic response type for all Supabase operations
export interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
  status: "success" | "error";
}

// Re-export database types
export type * from "./database.types";
