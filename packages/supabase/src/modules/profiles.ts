import { SupabaseClient, PostgrestSingleResponse } from "@supabase/supabase-js";
import {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "../types/database.types";

// Define table-specific types
export type Profile = Tables<"profiles">;
export type ProfileInsert = TablesInsert<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

/**
 * Fetches a profiles record by its primary key (id).
 * @param supabase The Supabase client instance.
 * @param id The primary key of the profiles to fetch.
 * @returns A promise that resolves to the fetched profiles record or null if not found.
 * @example
 * const { data, error } = await fetchProfileById({ supabase, id: "user-uuid-string" });
 */
export const fetchProfileById = async ({
  supabase,
  id,
}: {
  supabase: SupabaseClient<Database>;
  id: string;
}): Promise<PostgrestSingleResponse<Profile>> => {
  return supabase.from("profiles").select("*").eq("id", id).single();
};

/**
 * Creates a new profiles record.
 * Note: Typically, profiles are created via triggers on auth.users table.
 * Use this function cautiously.
 * @param supabase The Supabase client instance.
 * @param insertData The data to insert for the new profiles.
 * @returns A promise that resolves to the newly created profiles record.
 * @example
 * const { data, error } = await createProfile({ supabase, insertData: { id: 'user-uuid', username: 'newuser' } });
 */
export const createProfile = async ({
  supabase,
  insertData,
}: {
  supabase: SupabaseClient<Database>;
  insertData: ProfileInsert;
}): Promise<PostgrestSingleResponse<Profile>> => {
  // Profiles usually require the ID from the auth.users table
  if (!insertData.id) {
    return {
      data: null,
      error: {
        message: "Profile insert requires an id.",
        details: "",
        hint: "",
        code: "400",
      },
    } as any; // Basic error structure
  }
  return supabase.from("profiles").insert(insertData).select().single();
};

/**
 * Updates an existing profiles record by its primary key (id).
 * @param supabase The Supabase client instance.
 * @param id The primary key of the profiles to update.
 * @param updateData The data to update for the profiles.
 * @returns A promise that resolves to the updated profiles record.
 * @example
 * const { data, error } = await updateProfile({ supabase, id: "user-uuid-string", updateData: { username: 'updated_username' } });
 */
export const updateProfile = async ({
  supabase,
  id,
  updateData,
}: {
  supabase: SupabaseClient<Database>;
  id: string;
  updateData: ProfileUpdate;
}): Promise<PostgrestSingleResponse<Profile>> => {
  return supabase
    .from("profiles")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
};

/**
 * Deletes a profiles record by its primary key (id).
 * Note: Deleting a profile might have cascading effects or orphaned data.
 * Ensure referential integrity is handled (e.g., via database constraints or application logic).
 * @param supabase The Supabase client instance.
 * @param id The primary key of the profiles to delete.
 * @returns A promise that resolves with no data upon successful deletion.
 * @example
 * const { error } = await deleteProfile({ supabase, id: "user-uuid-string" });
 */
export const deleteProfile = async ({
  supabase,
  id,
}: {
  supabase: SupabaseClient<Database>;
  id: string;
}): Promise<PostgrestSingleResponse<null>> => {
  return supabase.from("profiles").delete().eq("id", id);
};

/**
 * Lists profiles records with pagination.
 * @param supabase The Supabase client instance.
 * @param page The page number to fetch (default: 1).
 * @param limit The number of records per page (default: 10).
 * @returns A promise that resolves to an array of profiles records.
 * @example
 * const { data, error } = await listProfiles({ supabase, page: 1, limit: 50 });
 */
export const listProfiles = async ({
  supabase,
  page = 1,
  limit = 10,
}: {
  supabase: SupabaseClient<Database>;
  page?: number;
  limit?: number;
}): Promise<PostgrestSingleResponse<Profile[]>> => {
  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;
  return supabase.from("profiles").select("*").range(rangeStart, rangeEnd);
};
