# React Query Hooks Module Generation Template

Given a Supabase table module (e.g., `organizations.ts`), generate a TypeScript React Query hooks module (`<TableName>.react.ts`) following these specifications:

## File Naming Convention

Generated files should be named using the pattern: `<TableName>.react.ts` (e.g., `organizations.react.ts`).

## Dependencies

Ensure the following imports are included:

```typescript
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
// import { useSupabaseClient } from '@/hooks/useSupabaseClient'; // REMOVED: Client is now passed explicitly
import { Database } from "../types/database.types"; // Assuming Database type is centrally defined
import {
  // Import types and functions from the corresponding table module
  TableName,
  TableNameInsert,
  TableNameUpdate,
  fetchTableNameById,
  createTableName,
  updateTableName,
  deleteTableName,
  listTableNames,
} from "../modules/<table_name>"; // Adjust path as necessary
import { PostgrestSingleResponse } from "@supabase/supabase-js"; // Or ResponseError if needed
```

Replace `TableName`, `table_name`, etc., with the actual names. Adjust the path to the module file. Also adjust the path to `database.types.ts` if needed.

## React Query Keys

Define query keys using a consistent structure:

- **List Key:** `['<table_name>']`
- **List with Filters/Pagination Key:** `['<table_name>', { filters... }]` (Adapt based on list function params)
- **Detail Key:** `['<table_name>', id]`

_Note: Query keys should include filters and the Supabase client instance if its properties (e.g., URL) could change and affect the query._

## Required Hooks

Implement the following React Query hooks:

### 1. Fetch Single Item (`useQuery`)

- **Hook Name:** `useTableName`
- **Parameters:** `id` (primary key), `options: { supabase: SupabaseClient<Database> }`
- **Functionality:** Calls `fetchTableNameById` using `useQuery`, passing the provided `supabase` client.
- **Returns:** `UseQueryResult<TableName, Error>`

### 2. Fetch List (`useQuery`)

- **Hook Name:** `useTableNames`
- **Parameters:** `filters: { page?: number, limit?: number, ... }`, `options: { supabase: SupabaseClient<Database> }`
- **Functionality:** Calls `listTableNames` using `useQuery`, passing the provided `supabase` client and filters.
- **Returns:** `UseQueryResult<TableName[], Error>`

### 3. Create Item (`useMutation`)

- **Hook Name:** `useCreateTableName`
- **Functionality:** Calls `createTableName` using `useMutation`. Expects `mutate` to be called with `{ supabase, insertData }`.
- **Invalidation:** Invalidates the appropriate list query key on success.
- **Returns:** `UseMutationResult<TableName, Error, { supabase: SupabaseClient<Database>; insertData: TableNameInsert }>`

### 4. Update Item (`useMutation`)

- **Hook Name:** `useUpdateTableName`
- **Functionality:** Calls `updateTableName` using `useMutation`. Expects `mutate` to be called with `{ supabase, id, updateData }`.
- **Invalidation:** Invalidates both the list key and the relevant detail key on success.
- **Returns:** `UseMutationResult<TableName, Error, { supabase: SupabaseClient<Database>; id: string; updateData: TableNameUpdate }>`

### 5. Delete Item (`useMutation`)

- **Hook Name:** `useDeleteTableName`
- **Functionality:** Calls `deleteTableName` using `useMutation`. Expects `mutate` to be called with `{ supabase, id }`.
- **Invalidation:** Invalidates both the list key and the relevant detail key on success.
- **Returns:** `UseMutationResult<null, Error, { supabase: SupabaseClient<Database>; id: string }>`

## Implementation Requirements

1. **Supabase Client:** The `SupabaseClient` instance must be passed explicitly to the hooks (`useQuery` based hooks accept it via an `options` object) or to the `mutate` function (`useMutation` based hooks expect it in the input object alongside the payload). **Do not** use a custom hook like `useSupabaseClient` within these generated hooks.
2. **Typing:** Ensure all hooks, parameters, and return types are correctly typed using TypeScript and `Database` types.
3. **Error Handling:** React Query handles mutation/query errors. Ensure the underlying Supabase functions in the table module handle `PostgrestSingleResponse` appropriately. Hooks should throw errors if the client is missing or if the underlying function call fails.
4. **Query Keys:** Use the defined key structure consistently. Consider including relevant filters and potentially client identifiers in keys if needed.
5. **Invalidation:** Implement correct query invalidation in mutation hooks to keep data fresh.
6. **Documentation:** Include JSDoc comments for each hook explaining its purpose, parameters (including the `supabase` client), return value, and usage examples showing how to pass the client.

## Example Hook Structure (`useTableName`)

```typescript
/**
 * Fetches a specific [table_name] record by its ID using React Query.
 * @param id The ID of the [table_name] to fetch.
 * @param options Options including the Supabase client.
 * @param options.supabase The Supabase client instance.
 * @returns A UseQueryResult object for the [table_name].
 * @example
 * const supabase = // ... get your Supabase client instance ...
 * const { data: tableName, isLoading, error } = useTableName('record-id', { supabase });
 */
export const useTableName = (
  id: string,
  options: { supabase: SupabaseClient<Database> },
): UseQueryResult<TableName, Error> => {
  const { supabase } = options;

  return useQuery<TableName, Error>({
    // Include supabase instance in the query key if needed, e.g., if URL can change
    queryKey: ["<table_name>", id /*, supabase */],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase client is required.");
      const { data, error } = await fetchTableNameById({ supabase, id });
      if (error) throw error;
      if (!data) throw new Error("[Table_name] not found");
      return data;
    },
    // Query is enabled only if id and supabase client are provided
    enabled: !!id && !!supabase,
  });
};

// Example Mutation Hook Structure (Conceptual - Apply to Create/Update/Delete)
/**
 * Creates a new [table_name] record.
 * @returns A UseMutationResult object. Call mutate with { supabase, insertData }.
 * @example
 * const supabase = // ... get your Supabase client instance ...
 * const mutation = useCreateTableName();
 * mutation.mutate({ supabase, insertData: { name: 'New Item' } });
 */
export const useCreateTableName = (): UseMutationResult<
  TableName,
  Error,
  { supabase: SupabaseClient<Database>; insertData: TableNameInsert }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    TableName,
    Error,
    { supabase: SupabaseClient<Database>; insertData: TableNameInsert }
  >({
    mutationFn: async ({ supabase, insertData }) => {
      if (!supabase) throw new Error("Supabase client is required.");
      const { data, error } = await createTableName({ supabase, insertData });
      if (error) throw error;
      if (!data)
        throw new Error("Failed to create [Table_name], no data returned.");
      return data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries, e.g., the list query
      queryClient.invalidateQueries({ queryKey: ["<table_name>"] });
      // Optionally update cache: queryClient.setQueryData(['<table_name>', data.id], data);
    },
  });
};

// ... implement other required hooks following similar patterns ...
```

</rewritten_file>
