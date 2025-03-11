import { SupabaseConfig, SupabaseResponse } from "./types";
import { PostgrestError } from "@supabase/supabase-js";

export * from "./types";

/**
 * Generic query helper following RORO pattern
 */
export async function query<T>({
  supabase,
  table,
  select = "*",
  match = {},
  single = false,
}: SupabaseConfig & {
  table: string;
  select?: string;
  match?: Record<string, any>;
  single?: boolean;
}): Promise<SupabaseResponse<T>> {
  try {
    const query = supabase.from(table).select(select).match(match);
    const { data, error } = await (single ? query.single() : query);

    if (error) throw error;

    return {
      data: data as T,
      error: null,
      status: "success",
    };
  } catch (error) {
    return {
      data: null,
      error: error as PostgrestError,
      status: "error",
    };
  }
}

/**
 * Generic insert helper following RORO pattern
 */
export async function insert<T>({
  supabase,
  table,
  data,
  returning = "*",
}: SupabaseConfig & {
  table: string;
  data: Record<string, any> | Record<string, any>[];
  returning?: string;
}): Promise<SupabaseResponse<T>> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select(returning);

    if (error) throw error;

    return {
      data: result as T,
      error: null,
      status: "success",
    };
  } catch (error) {
    return {
      data: null,
      error: error as PostgrestError,
      status: "error",
    };
  }
}

/**
 * Generic update helper following RORO pattern
 */
export async function update<T>({
  supabase,
  table,
  match,
  data,
  returning = "*",
}: SupabaseConfig & {
  table: string;
  match: Record<string, any>;
  data: Record<string, any>;
  returning?: string;
}): Promise<SupabaseResponse<T>> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .match(match)
      .select(returning);

    if (error) throw error;

    return {
      data: result as T,
      error: null,
      status: "success",
    };
  } catch (error) {
    return {
      data: null,
      error: error as PostgrestError,
      status: "error",
    };
  }
}

/**
 * Generic delete helper following RORO pattern
 */
export async function remove<T>({
  supabase,
  table,
  match,
  returning = "*",
}: SupabaseConfig & {
  table: string;
  match: Record<string, any>;
  returning?: string;
}): Promise<SupabaseResponse<T>> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .delete()
      .match(match)
      .select(returning);

    if (error) throw error;

    return {
      data: result as T,
      error: null,
      status: "success",
    };
  } catch (error) {
    return {
      data: null,
      error: error as PostgrestError,
      status: "error",
    };
  }
}
