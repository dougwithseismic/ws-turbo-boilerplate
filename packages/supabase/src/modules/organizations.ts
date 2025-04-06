import { SupabaseClient, PostgrestSingleResponse } from "@supabase/supabase-js";
import {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "../types/database.types";

// Define table-specific types
export type Organization = Tables<"organizations">;
export type OrganizationInsert = TablesInsert<"organizations">;
export type OrganizationUpdate = TablesUpdate<"organizations">;

/**
 * Fetches an organizations record by its primary key (id).
 * @param supabase The Supabase client instance.
 * @param id The primary key of the organizations to fetch.
 * @returns A promise that resolves to the fetched organizations record or null if not found.
 * @example
 * const { data, error } = await fetchOrganizationById({ supabase, id: "uuid-string" });
 */
export const fetchOrganizationById = async ({
  supabase,
  id,
}: {
  supabase: SupabaseClient<Database>;
  id: string;
}): Promise<PostgrestSingleResponse<Organization>> => {
  return supabase.from("organizations").select("*").eq("id", id).single();
};

/**
 * Creates a new organizations record.
 * @param supabase The Supabase client instance.
 * @param insertData The data to insert for the new organizations.
 * @returns A promise that resolves to the newly created organizations record.
 * @example
 * const { data, error } = await createOrganization({ supabase, insertData: { name: 'New Org' } });
 */
export const createOrganization = async ({
  supabase,
  insertData,
}: {
  supabase: SupabaseClient<Database>;
  insertData: OrganizationInsert;
}): Promise<PostgrestSingleResponse<Organization>> => {
  return supabase.from("organizations").insert(insertData).select().single();
};

/**
 * Updates an existing organizations record by its primary key (id).
 * @param supabase The Supabase client instance.
 * @param id The primary key of the organizations to update.
 * @param updateData The data to update for the organizations.
 * @returns A promise that resolves to the updated organizations record.
 * @example
 * const { data, error } = await updateOrganization({ supabase, id: "uuid-string", updateData: { name: 'Updated Org Name' } });
 */
export const updateOrganization = async ({
  supabase,
  id,
  updateData,
}: {
  supabase: SupabaseClient<Database>;
  id: string;
  updateData: OrganizationUpdate;
}): Promise<PostgrestSingleResponse<Organization>> => {
  return supabase
    .from("organizations")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
};

/**
 * Deletes an organizations record by its primary key (id).
 * @param supabase The Supabase client instance.
 * @param id The primary key of the organizations to delete.
 * @returns A promise that resolves with no data upon successful deletion.
 * @example
 * const { error } = await deleteOrganization({ supabase, id: "uuid-string" });
 */
export const deleteOrganization = async ({
  supabase,
  id,
}: {
  supabase: SupabaseClient<Database>;
  id: string;
}): Promise<PostgrestSingleResponse<null>> => {
  return supabase.from("organizations").delete().eq("id", id);
};

/**
 * Lists organizations records with pagination.
 * @param supabase The Supabase client instance.
 * @param page The page number to fetch (default: 1).
 * @param limit The number of records per page (default: 10).
 * @returns A promise that resolves to an array of organizations records.
 * @example
 * const { data, error } = await listOrganizations({ supabase, page: 2, limit: 20 });
 */
export const listOrganizations = async ({
  supabase,
  page = 1,
  limit = 10,
}: {
  supabase: SupabaseClient<Database>;
  page?: number;
  limit?: number;
}): Promise<PostgrestSingleResponse<Organization[]>> => {
  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;
  return supabase.from("organizations").select("*").range(rangeStart, rangeEnd);
};
