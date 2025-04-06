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
  Organization,
  OrganizationInsert,
  OrganizationUpdate,
  fetchOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  listOrganizations,
} from "./organizations"; // Adjusted path

/**
 * Fetches a specific organization record by its ID using React Query.
 * @param id The ID of the organization to fetch.
 * @param options Options including the Supabase client.
 * @param options.supabase The Supabase client instance.
 * @returns A UseQueryResult object for the organization.
 * @example
 * const supabase = // ... get your Supabase client instance ...
 * const { data: organization, isLoading, error } = useOrganization('org-uuid', { supabase });
 */
export const useOrganization = (
  id: string,
  options: { supabase: SupabaseClient<Database> },
): UseQueryResult<Organization, Error> => {
  const { supabase } = options;

  return useQuery<Organization, Error>({
    queryKey: ["organizations", id],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase client is required.");
      const { data, error } = await fetchOrganizationById({ supabase, id });
      if (error) throw error;
      if (!data) throw new Error("Organization not found");
      return data;
    },
    enabled: !!id && !!supabase,
  });
};

/**
 * Fetches a list of organization records using React Query.
 * @param filters Filters for pagination (page, limit).
 * @param options Options including the Supabase client.
 * @param options.supabase The Supabase client instance.
 * @returns A UseQueryResult object for the list of organizations.
 * @example
 * const supabase = // ... get your Supabase client instance ...
 * const { data: organizations, isLoading, error } = useOrganizations({ page: 1, limit: 10 }, { supabase });
 */
export const useOrganizations = (
  filters: { page?: number; limit?: number },
  options: { supabase: SupabaseClient<Database> },
): UseQueryResult<Organization[], Error> => {
  const { supabase } = options;
  const { page = 1, limit = 10 } = filters;

  return useQuery<Organization[], Error>({
    queryKey: ["organizations", { page, limit }],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase client is required.");
      const { data, error } = await listOrganizations({
        supabase,
        page,
        limit,
      });
      if (error) throw error;
      return data || []; // Return empty array if data is null
    },
    enabled: !!supabase,
  });
};

/**
 * Creates a new organization record.
 * @returns A UseMutationResult object. Call mutate with { supabase, insertData }.
 * @example
 * const supabase = // ... get your Supabase client instance ...
 * const mutation = useCreateOrganization();
 * mutation.mutate({ supabase, insertData: { name: 'New Org' } });
 */
export const useCreateOrganization = (): UseMutationResult<
  Organization,
  Error,
  { supabase: SupabaseClient<Database>; insertData: OrganizationInsert }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    Organization,
    Error,
    { supabase: SupabaseClient<Database>; insertData: OrganizationInsert }
  >({
    mutationFn: async ({ supabase, insertData }) => {
      if (!supabase) throw new Error("Supabase client is required.");
      const { data, error } = await createOrganization({
        supabase,
        insertData,
      });
      if (error) throw error;
      if (!data)
        throw new Error("Failed to create Organization, no data returned.");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.setQueryData(["organizations", data.id], data);
    },
  });
};

/**
 * Updates an existing organization record.
 * @returns A UseMutationResult object. Call mutate with { supabase, id, updateData }.
 * @example
 * const supabase = // ... get your Supabase client instance ...
 * const mutation = useUpdateOrganization();
 * mutation.mutate({ supabase, id: 'org-uuid', updateData: { name: 'Updated Org Name' } });
 */
export const useUpdateOrganization = (): UseMutationResult<
  Organization,
  Error,
  {
    supabase: SupabaseClient<Database>;
    id: string;
    updateData: OrganizationUpdate;
  }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    Organization,
    Error,
    {
      supabase: SupabaseClient<Database>;
      id: string;
      updateData: OrganizationUpdate;
    }
  >({
    mutationFn: async ({ supabase, id, updateData }) => {
      if (!supabase) throw new Error("Supabase client is required.");
      const { data, error } = await updateOrganization({
        supabase,
        id,
        updateData,
      });
      if (error) throw error;
      if (!data)
        throw new Error("Failed to update Organization, no data returned.");
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({
        queryKey: ["organizations", variables.id],
      });
      queryClient.setQueryData(["organizations", variables.id], data);
    },
  });
};

/**
 * Deletes an organization record.
 * @returns A UseMutationResult object. Call mutate with { supabase, id }.
 * @example
 * const supabase = // ... get your Supabase client instance ...
 * const mutation = useDeleteOrganization();
 * mutation.mutate({ supabase, id: 'org-uuid-to-delete' });
 */
export const useDeleteOrganization = (): UseMutationResult<
  null,
  Error,
  { supabase: SupabaseClient<Database>; id: string }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    null,
    Error,
    { supabase: SupabaseClient<Database>; id: string }
  >({
    mutationFn: async ({ supabase, id }) => {
      if (!supabase) throw new Error("Supabase client is required.");
      const { error } = await deleteOrganization({ supabase, id });
      if (error) throw error;
      return null;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.removeQueries({ queryKey: ["organizations", variables.id] });
    },
  });
};
