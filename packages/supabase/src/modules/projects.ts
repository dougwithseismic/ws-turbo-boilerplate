import { SupabaseClient, PostgrestSingleResponse } from "@supabase/supabase-js";
import {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "../types/database.types";

// Define table-specific types
export type Project = Tables<"projects">;
export type ProjectInsert = TablesInsert<"projects">;
export type ProjectUpdate = TablesUpdate<"projects">;

/**
 * Fetches a projects record by its primary key (id).
 * @param supabase The Supabase client instance.
 * @param id The primary key of the projects to fetch.
 * @returns A promise that resolves to the fetched projects record or null if not found.
 * @example
 * const { data, error } = await fetchProjectById({ supabase, id: "project-uuid-string" });
 */
export const fetchProjectById = async ({
  supabase,
  id,
}: {
  supabase: SupabaseClient<Database>;
  id: string;
}): Promise<PostgrestSingleResponse<Project>> => {
  return supabase.from("projects").select("*").eq("id", id).single();
};

/**
 * Creates a new projects record.
 * @param supabase The Supabase client instance.
 * @param insertData The data to insert for the new projects.
 * @returns A promise that resolves to the newly created projects record.
 * @example
 * const { data, error } = await createProject({ supabase, insertData: { name: 'New Project', organization_id: 'org-uuid' } });
 */
export const createProject = async ({
  supabase,
  insertData,
}: {
  supabase: SupabaseClient<Database>;
  insertData: ProjectInsert;
}): Promise<PostgrestSingleResponse<Project>> => {
  return supabase.from("projects").insert(insertData).select().single();
};

/**
 * Updates an existing projects record by its primary key (id).
 * @param supabase The Supabase client instance.
 * @param id The primary key of the projects to update.
 * @param updateData The data to update for the projects.
 * @returns A promise that resolves to the updated projects record.
 * @example
 * const { data, error } = await updateProject({ supabase, id: "project-uuid-string", updateData: { description: 'Updated description' } });
 */
export const updateProject = async ({
  supabase,
  id,
  updateData,
}: {
  supabase: SupabaseClient<Database>;
  id: string;
  updateData: ProjectUpdate;
}): Promise<PostgrestSingleResponse<Project>> => {
  return supabase
    .from("projects")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
};

/**
 * Deletes a projects record by its primary key (id).
 * @param supabase The Supabase client instance.
 * @param id The primary key of the projects to delete.
 * @returns A promise that resolves with no data upon successful deletion.
 * @example
 * const { error } = await deleteProject({ supabase, id: "project-uuid-string" });
 */
export const deleteProject = async ({
  supabase,
  id,
}: {
  supabase: SupabaseClient<Database>;
  id: string;
}): Promise<PostgrestSingleResponse<null>> => {
  return supabase.from("projects").delete().eq("id", id);
};

/**
 * Lists projects records with pagination.
 * @param supabase The Supabase client instance.
 * @param page The page number to fetch (default: 1).
 * @param limit The number of records per page (default: 10).
 * @returns A promise that resolves to an array of projects records.
 * @example
 * const { data, error } = await listProjects({ supabase, page: 1, limit: 25 });
 */
export const listProjects = async ({
  supabase,
  page = 1,
  limit = 10,
}: {
  supabase: SupabaseClient<Database>;
  page?: number;
  limit?: number;
}): Promise<PostgrestSingleResponse<Project[]>> => {
  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;
  return supabase.from("projects").select("*").range(rangeStart, rangeEnd);
};
