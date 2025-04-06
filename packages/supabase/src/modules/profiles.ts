import {
  SupabaseClient,
  PostgrestSingleResponse,
  PostgrestResponse,
} from "@supabase/supabase-js";
import {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "../types/database.types";

export type Profile = Tables<"profiles">;
export type ProfileInsert = TablesInsert<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

/**
 * Fetches a profile by user ID
 *
 * @example
 * ```typescript
 * const { data, error } = await fetchProfileByUserId({
 *   supabase,
 *   userId: "123e4567-e89b-12d3-a456-426614174000"
 * });
 *
 * if (error) {
 *   console.error('Error:', error.message);
 *   return;
 * }
 *
 * console.log('Profile:', data);
 * ```
 */
export const fetchProfileByUserId = async ({
  supabase,
  userId,
}: {
  supabase: SupabaseClient<Database>;
  userId: string;
}): Promise<PostgrestSingleResponse<Profile>> => {
  return await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
};

/**
 * Fetches a profile by username
 *
 * @example
 * ```typescript
 * const { data, error } = await fetchProfileByUsername({
 *   supabase,
 *   username: "johndoe"
 * });
 *
 * if (error) {
 *   console.error('Error:', error.message);
 *   return;
 * }
 *
 * console.log('Profile:', data);
 * ```
 */
export const fetchProfileByUsername = async ({
  supabase,
  username,
}: {
  supabase: SupabaseClient<Database>;
  username: string;
}): Promise<PostgrestSingleResponse<Profile>> => {
  return await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
};

/**
 * Creates a new profile
 *
 * @example
 * ```typescript
 * const { data, error } = await createProfile({
 *   supabase,
 *   profile: {
 *     user_id: "123e4567-e89b-12d3-a456-426614174000",
 *     username: "johndoe",
 *     full_name: "John Doe",
 *     email: "john@example.com"
 *   }
 * });
 *
 * if (error) {
 *   console.error('Error:', error.message);
 *   return;
 * }
 *
 * console.log('Created profile:', data);
 * ```
 */
export const createProfile = async ({
  supabase,
  profile,
}: {
  supabase: SupabaseClient<Database>;
  profile: ProfileInsert;
}): Promise<PostgrestSingleResponse<Profile>> => {
  return await supabase.from("profiles").insert(profile).select().single();
};

/**
 * Updates an existing profile
 *
 * @example
 * ```typescript
 * const { data, error } = await updateProfile({
 *   supabase,
 *   userId: "123e4567-e89b-12d3-a456-426614174000",
 *   updates: {
 *     bio: "Hello, World!",
 *     website: "https://example.com"
 *   }
 * });
 *
 * if (error) {
 *   console.error('Error:', error.message);
 *   return;
 * }
 *
 * console.log('Updated profile:', data);
 * ```
 */
export const updateProfile = async ({
  supabase,
  userId,
  updates,
}: {
  supabase: SupabaseClient<Database>;
  userId: string;
  updates: ProfileUpdate;
}): Promise<PostgrestSingleResponse<Profile>> => {
  return await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();
};

/**
 * Deletes a profile
 *
 * @example
 * ```typescript
 * const { error } = await deleteProfile({
 *   supabase,
 *   userId: "123e4567-e89b-12d3-a456-426614174000"
 * });
 *
 * if (error) {
 *   console.error('Error:', error.message);
 *   return;
 * }
 *
 * console.log('Profile deleted successfully');
 * ```
 */
export const deleteProfile = async ({
  supabase,
  userId,
}: {
  supabase: SupabaseClient<Database>;
  userId: string;
}): Promise<PostgrestSingleResponse<null>> => {
  return await supabase
    .from("profiles")
    .delete()
    .eq("user_id", userId)
    .single();
};

/**
 * Lists all profiles with optional pagination
 *
 * @example
 * ```typescript
 * // Fetch first page with 20 items per page
 * const { data, error } = await listProfiles({
 *   supabase,
 *   page: 1,
 *   limit: 20
 * });
 *
 * if (error) {
 *   console.error('Error:', error.message);
 *   return;
 * }
 *
 * console.log('Profiles:', data);
 * console.log('Count:', data.length);
 * ```
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
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return await supabase.from("profiles").select("*").range(from, to);
};
