import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import {
  Project,
  ProjectInsert,
  ProjectUpdate,
  fetchProjectById,
  createProject,
  updateProject,
  deleteProject,
  listProjects,
} from "./projects"; // Adjusted path

/**
 * Fetches a specific project record by its ID using React Query.
 * @param id The ID of the project to fetch.
 * @param options Options including the Supabase client.
 * @param options.supabase The Supabase client instance.
 * @returns A UseQueryResult object for the project.
 * @example
 * const supabase = // ... get your Supabase client instance ...
 * const { data: project, isLoading, error } = useProject('project-uuid', { supabase });
 */
export const useProject = (
  id: string,
  options: { supabase: SupabaseClient<Database> },
): UseQueryResult<Project, Error> => {
  const { supabase } = options;

  return useQuery<Project, Error>({
    queryKey: ["projects", id],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase client is required.");
      const { data, error } = await fetchProjectById({ supabase, id });
      if (error) throw error;
      if (!data) throw new Error("Project not found");
      return data;
    },
    enabled: !!id && !!supabase,
  });
};

/**
 * Fetches a list of projects records using React Query.
 * @param filters Filters for pagination (page, limit). Add other filters as needed (e.g., organization_id).
 * @param options Options including the Supabase client.
 * @param options.supabase The Supabase client instance.
 * @returns A UseQueryResult object for the list of projects.
 * @example
 * const supabase = // ... get your Supabase client instance ...
 * const { data: projects, isLoading, error } = useProjects({ page: 1, limit: 10 }, { supabase });
 * // Example with hypothetical organization filter (if listProjects supports it)
 * // const { data: orgProjects } = useProjects({ organization_id: 'org-uuid' }, { supabase });
 */
export const useProjects = (
  filters: { page?: number; limit?: number; [key: string]: any }, // Allow additional filters
  options: { supabase: SupabaseClient<Database> },
): UseQueryResult<Project[], Error> => {
  const { supabase } = options;
  // Extract known filters, pass the rest if listProjects supports them (adjust listProjects accordingly)
  const { page = 1, limit = 10, ...otherFilters } = filters;

  return useQuery<Project[], Error>({
    // Include all filters in the query key for proper caching
    queryKey: ["projects", { page, limit, ...otherFilters }],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase client is required.");
      // Pass all filters to listProjects (modify listProjects to accept them if needed)
      const { data, error } = await listProjects({
        supabase,
        page,
        limit,
        ...otherFilters,
      });
      if (error) throw error;
      return data || []; // Return empty array if data is null
    },
    enabled: !!supabase,
  });
};

/**
 * Creates a new project record.
 * @returns A UseMutationResult object. Call mutate with { supabase, insertData }.
 * @example
 * const supabase = // ... get your Supabase client instance ...
 * const mutation = useCreateProject();
 * mutation.mutate({ supabase, insertData: { name: 'New Project', organization_id: 'org-uuid' } });
 */
export const useCreateProject = (): UseMutationResult<
  Project,
  Error,
  { supabase: SupabaseClient<Database>; insertData: ProjectInsert }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    Project,
    Error,
    { supabase: SupabaseClient<Database>; insertData: ProjectInsert }
  >({
    mutationFn: async ({ supabase, insertData }) => {
      if (!supabase) throw new Error("Supabase client is required.");
      const { data, error } = await createProject({ supabase, insertData });
      if (error) throw error;
      if (!data) throw new Error("Failed to create Project, no data returned.");
      return data;
    },
    onSuccess: (data) => {
      // Invalidate the general list query. Consider invalidating specific filtered lists too if applicable.
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      // Optionally prime the cache for the new item
      queryClient.setQueryData(["projects", data.id], data);
    },
  });
};

/**
 * Updates an existing project record.
 * @returns A UseMutationResult object. Call mutate with { supabase, id, updateData }.
 * @example
 * const supabase = // ... get your Supabase client instance ...
 * const mutation = useUpdateProject();
 * mutation.mutate({ supabase, id: 'project-uuid', updateData: { description: 'Updated description' } });
 */
export const useUpdateProject = (): UseMutationResult<
  Project,
  Error,
  { supabase: SupabaseClient<Database>; id: string; updateData: ProjectUpdate }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    Project,
    Error,
    {
      supabase: SupabaseClient<Database>;
      id: string;
      updateData: ProjectUpdate;
    }
  >({
    mutationFn: async ({ supabase, id, updateData }) => {
      if (!supabase) throw new Error("Supabase client is required.");
      const { data, error } = await updateProject({ supabase, id, updateData });
      if (error) throw error;
      if (!data) throw new Error("Failed to update Project, no data returned.");
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate the general list query and the specific item query
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", variables.id] });
      // Optionally update the cache for the updated item
      queryClient.setQueryData(["projects", variables.id], data);
    },
  });
};

/**
 * Deletes a project record.
 * @returns A UseMutationResult object. Call mutate with { supabase, id }.
 * @example
 * const supabase = // ... get your Supabase client instance ...
 * const mutation = useDeleteProject();
 * mutation.mutate({ supabase, id: 'project-uuid-to-delete' });
 */
export const useDeleteProject = (): UseMutationResult<
  null,
  Error,
  { supabase: SupabaseClient<Database>; id: string }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    null, // delete returns null on success
    Error,
    { supabase: SupabaseClient<Database>; id: string }
  >({
    mutationFn: async ({ supabase, id }) => {
      if (!supabase) throw new Error("Supabase client is required.");
      const { error } = await deleteProject({ supabase, id });
      if (error) throw error;
      return null;
    },
    onSuccess: (data, variables) => {
      // Invalidate the general list query and remove the specific item query from cache
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.removeQueries({ queryKey: ["projects", variables.id] });
    },
  });
};
