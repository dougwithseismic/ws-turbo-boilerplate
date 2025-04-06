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
  Profile,
  ProfileInsert,
  ProfileUpdate,
  fetchProfileById,
  createProfile, // Note: Cautious usage as per module docs
  updateProfile,
  deleteProfile,
  listProfiles,
} from "./profiles"; // Adjusted path

/**
 * Fetches a specific profile record by its ID using React Query.
 * @param id The ID of the profile to fetch.
 * @param options Options including the Supabase client.
 * @param options.supabase The Supabase client instance.
 * @returns A UseQueryResult object for the profile.
 * @example
 * const supabase = // ... get your Supabase client instance ...
 * const { data: profile, isLoading, error } = useProfile('user-uuid', { supabase });
 */
export const useProfile = (
  id: string,
  options: { supabase: SupabaseClient<Database> },
): UseQueryResult<Profile, Error> => {
  const { supabase } = options;

  return useQuery<Profile, Error>({
    queryKey: ["profiles", id],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase client is required.");
      const { data, error } = await fetchProfileById({ supabase, id });
      if (error) throw error;
      if (!data) throw new Error("Profile not found");
      return data;
    },
    enabled: !!id && !!supabase,
  });
};

/**
 * Fetches a list of profile records using React Query.
 * @param filters Filters for pagination (page, limit).
 * @param options Options including the Supabase client.
 * @param options.supabase The Supabase client instance.
 * @returns A UseQueryResult object for the list of profiles.
 * @example
 * const supabase = // ... get your Supabase client instance ...
 * const { data: profiles, isLoading, error } = useProfiles({ page: 1, limit: 10 }, { supabase });
 */
export const useProfiles = (
  filters: { page?: number; limit?: number },
  options: { supabase: SupabaseClient<Database> },
): UseQueryResult<Profile[], Error> => {
  const { supabase } = options;
  const { page = 1, limit = 10 } = filters;

  return useQuery<Profile[], Error>({
    queryKey: ["profiles", { page, limit }],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase client is required.");
      const { data, error } = await listProfiles({ supabase, page, limit });
      if (error) throw error;
      return data || []; // Return empty array if data is null
    },
    enabled: !!supabase,
  });
};

/**
 * Creates a new profile record.
 * Note: Typically, profiles are created via triggers. Use cautiously.
 * @returns A UseMutationResult object. Call mutate with { supabase, insertData }.
 * @example
 * const supabase = // ... get your Supabase client instance ...
 * const mutation = useCreateProfile();
 * mutation.mutate({ supabase, insertData: { id: 'auth-user-uuid', username: 'newuser' } });
 */
export const useCreateProfile = (): UseMutationResult<
  Profile,
  Error,
  { supabase: SupabaseClient<Database>; insertData: ProfileInsert }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    Profile,
    Error,
    { supabase: SupabaseClient<Database>; insertData: ProfileInsert }
  >({
    mutationFn: async ({ supabase, insertData }) => {
      if (!supabase) throw new Error("Supabase client is required.");
      // The underlying createProfile function handles the check for insertData.id
      const { data, error } = await createProfile({ supabase, insertData });
      if (error) throw new Error(error.message); // Throw PostgrestError message
      if (!data) throw new Error("Failed to create Profile, no data returned.");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.setQueryData(["profiles", data.id], data);
    },
  });
};

/**
 * Updates an existing profile record.
 * @returns A UseMutationResult object. Call mutate with { supabase, id, updateData }.
 * @example
 * const supabase = // ... get your Supabase client instance ...
 * const mutation = useUpdateProfile();
 * mutation.mutate({ supabase, id: 'user-uuid', updateData: { username: 'updated_name' } });
 */
export const useUpdateProfile = (): UseMutationResult<
  Profile,
  Error,
  { supabase: SupabaseClient<Database>; id: string; updateData: ProfileUpdate }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    Profile,
    Error,
    {
      supabase: SupabaseClient<Database>;
      id: string;
      updateData: ProfileUpdate;
    }
  >({
    mutationFn: async ({ supabase, id, updateData }) => {
      if (!supabase) throw new Error("Supabase client is required.");
      const { data, error } = await updateProfile({ supabase, id, updateData });
      if (error) throw error;
      if (!data) throw new Error("Failed to update Profile, no data returned.");
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profiles", variables.id] });
      queryClient.setQueryData(["profiles", variables.id], data);
    },
  });
};

/**
 * Deletes a profile record.
 * Note: Consider cascade effects.
 * @returns A UseMutationResult object. Call mutate with { supabase, id }.
 * @example
 * const supabase = // ... get your Supabase client instance ...
 * const mutation = useDeleteProfile();
 * mutation.mutate({ supabase, id: 'user-uuid-to-delete' });
 */
export const useDeleteProfile = (): UseMutationResult<
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
      const { error } = await deleteProfile({ supabase, id });
      if (error) throw error;
      return null;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.removeQueries({ queryKey: ["profiles", variables.id] });
    },
  });
};
