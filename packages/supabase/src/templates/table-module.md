# Table Module Generation Template

Given a Supabase table definition, generate a TypeScript module following these specifications:

## Type Definitions

1. Export three types based on the table name:

```typescript
export type TableName = Tables<"table_name">;
export type TableNameInsert = TablesInsert<"table_name">;
export type TableNameUpdate = TablesUpdate<"table_name">;
```

## Required Functions

For each table, implement these core functions:

### 1. Fetch by ID

- Function name: `fetchTableNameById`
- Parameters: supabase client and primary key
- Returns: PostgrestSingleResponse<TableName>

### 2. Create

- Function name: `createTableName`
- Parameters: supabase client and insert payload
- Returns: PostgrestSingleResponse<TableName>

### 3. Update

- Function name: `updateTableName`
- Parameters: supabase client, primary key, and update payload
- Returns: PostgrestSingleResponse<TableName>

### 4. Delete

- Function name: `deleteTableName`
- Parameters: supabase client and primary key
- Returns: PostgrestSingleResponse<null>

### 5. List

- Function name: `listTableNames`
- Parameters: supabase client, optional page and limit
- Returns: PostgrestSingleResponse<TableName[]>

## Implementation Requirements

1. Each function should:

   - Be properly typed with TypeScript
   - Include JSDoc documentation with examples
   - Handle errors appropriately
   - Use the Supabase client methods correctly

2. Follow these patterns:

   - Use consistent parameter naming
   - Implement pagination in list functions
   - Return PostgrestSingleResponse types
   - Use proper table name in Supabase queries

3. Documentation:
   - Include usage examples in JSDoc
   - Document all parameters
   - Show error handling in examples

## Example Structure

````typescript
import { SupabaseClient, PostgrestSingleResponse } from "@supabase/supabase-js";
import {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "../types/database.types";

export type TableName = Tables<"table_name">;
export type TableNameInsert = TablesInsert<"table_name">;
export type TableNameUpdate = TablesUpdate<"table_name">;

/**
 * Fetches a [table_name] by ID
 *
 * @example
 * ```typescript
 * const { data, error } = await fetchTableNameById({
 *   supabase,
 *   id: "123"
 * });
 * ```
 */
export const fetchTableNameById = async ({
  supabase,
  id,
}: {
  supabase: SupabaseClient<Database>;
  id: string;
}): Promise<PostgrestSingleResponse<TableName>> => {
  return await supabase.from("table_name").select("*").eq("id", id).single();
};

// ... implement other required functions ...
````
