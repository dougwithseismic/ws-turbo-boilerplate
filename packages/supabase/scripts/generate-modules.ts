/// <reference types="node" />
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility functions
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
const camelCase = (str: string) =>
  str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
const pascalCase = (str: string) => capitalize(camelCase(str));
const pluralize = (str: string) => (str.endsWith("s") ? str : `${str}s`);

// Read database types and extract table names
const getDatabaseTables = () => {
  const dbTypesPath = path.join(__dirname, "../src/types/database.types.ts");
  const content = fs.readFileSync(dbTypesPath, "utf-8");

  // Extract table names from the Database type
  const tableMatch = content.match(/public: {\s+Tables: {([^}]+)}/s);
  if (!tableMatch) return [];

  const tablesSection = tableMatch[1];
  const tableNames =
    tablesSection
      .match(/(\w+): {/g)
      ?.map((m) => m.replace(/[:{]/g, "").trim()) || [];

  return tableNames;
};

// Generate module content for a table
const generateModuleContent = (tableName: string) => {
  const singularName = tableName.endsWith("s")
    ? tableName.slice(0, -1)
    : tableName;
  const PascalName = pascalCase(singularName);

  return `import {
  SupabaseClient,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";
import {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "../types/database.types";

export type ${PascalName} = Tables<"${tableName}">;
export type ${PascalName}Insert = TablesInsert<"${tableName}">;
export type ${PascalName}Update = TablesUpdate<"${tableName}">;

/**
 * Fetches a ${singularName} by ID
 *
 * @example
 * \`\`\`typescript
 * const { data, error } = await fetch${PascalName}ById({
 *   supabase,
 *   id: "123e4567-e89b-12d3-a456-426614174000"
 * });
 *
 * if (error) {
 *   console.error('Error:', error.message);
 *   return;
 * }
 *
 * console.log('${PascalName}:', data);
 * \`\`\`
 */
export const fetch${PascalName}ById = async ({
  supabase,
  id,
}: {
  supabase: SupabaseClient<Database>;
  id: string;
}): Promise<PostgrestSingleResponse<${PascalName}>> => {
  return await supabase
    .from("${tableName}")
    .select("*")
    .eq("id", id)
    .single();
};

/**
 * Creates a new ${singularName}
 *
 * @example
 * \`\`\`typescript
 * const { data, error } = await create${PascalName}({
 *   supabase,
 *   ${singularName}: {
 *     // ... ${singularName} properties
 *   }
 * });
 *
 * if (error) {
 *   console.error('Error:', error.message);
 *   return;
 * }
 *
 * console.log('Created ${singularName}:', data);
 * \`\`\`
 */
export const create${PascalName} = async ({
  supabase,
  ${singularName},
}: {
  supabase: SupabaseClient<Database>;
  ${singularName}: ${PascalName}Insert;
}): Promise<PostgrestSingleResponse<${PascalName}>> => {
  return await supabase
    .from("${tableName}")
    .insert(${singularName})
    .select()
    .single();
};

/**
 * Updates an existing ${singularName}
 *
 * @example
 * \`\`\`typescript
 * const { data, error } = await update${PascalName}({
 *   supabase,
 *   id: "123e4567-e89b-12d3-a456-426614174000",
 *   updates: {
 *     // ... update properties
 *   }
 * });
 *
 * if (error) {
 *   console.error('Error:', error.message);
 *   return;
 * }
 *
 * console.log('Updated ${singularName}:', data);
 * \`\`\`
 */
export const update${PascalName} = async ({
  supabase,
  id,
  updates,
}: {
  supabase: SupabaseClient<Database>;
  id: string;
  updates: ${PascalName}Update;
}): Promise<PostgrestSingleResponse<${PascalName}>> => {
  return await supabase
    .from("${tableName}")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
};

/**
 * Deletes a ${singularName}
 *
 * @example
 * \`\`\`typescript
 * const { error } = await delete${PascalName}({
 *   supabase,
 *   id: "123e4567-e89b-12d3-a456-426614174000"
 * });
 *
 * if (error) {
 *   console.error('Error:', error.message);
 *   return;
 * }
 *
 * console.log('${PascalName} deleted successfully');
 * \`\`\`
 */
export const delete${PascalName} = async ({
  supabase,
  id,
}: {
  supabase: SupabaseClient<Database>;
  id: string;
}): Promise<PostgrestSingleResponse<null>> => {
  return await supabase
    .from("${tableName}")
    .delete()
    .eq("id", id)
    .single();
};

/**
 * Lists all ${tableName} with optional pagination
 *
 * @example
 * \`\`\`typescript
 * // Fetch first page with 20 items per page
 * const { data, error } = await list${PascalName}s({
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
 * console.log('${PascalName}s:', data);
 * console.log('Count:', data.length);
 * \`\`\`
 */
export const list${PascalName}s = async ({
  supabase,
  page = 1,
  limit = 10,
}: {
  supabase: SupabaseClient<Database>;
  page?: number;
  limit?: number;
}): Promise<PostgrestSingleResponse<${PascalName}[]>> => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return await supabase
    .from("${tableName}")
    .select("*")
    .range(from, to);
};
`;
};

// Update the main index.ts to export all modules
const updateMainIndex = (tableNames: string[]) => {
  const indexPath = path.join(__dirname, "../src/index.ts");

  // Read existing content
  let existingContent = "";
  try {
    existingContent = fs.readFileSync(indexPath, "utf-8");
  } catch (error) {
    // If file doesn't exist, start with base exports
    existingContent = 'export * from "./types";\n\n';
  }

  // Parse existing exports
  const exportLines = existingContent.split("\n");
  const existingExports = new Set(
    exportLines
      .filter((line) => line.startsWith('export * from "./modules/'))
      .map((line) => {
        const match = line.match(/\.\/modules\/([^"]+)"/);
        return match ? match[1] : null;
      })
      .filter(Boolean),
  );

  // Add new table exports while preserving existing ones
  tableNames.forEach((table) => {
    existingExports.add(table);
  });

  // Reconstruct the index file content
  let content = 'export * from "./types";\n\n';
  Array.from(existingExports)
    .sort() // Keep exports sorted alphabetically
    .forEach((table) => {
      content += `export * from "./modules/${table}";\n`;
    });

  // Only write if content has changed
  if (content !== existingContent) {
    fs.writeFileSync(indexPath, content);
    console.log("Updated index.ts with new exports");
  } else {
    console.log("index.ts is already up to date");
  }
};

// Main function to generate all modules
const generateModules = () => {
  const tables = getDatabaseTables();
  const modulesDir = path.join(__dirname, "../src/modules");

  // Create modules directory if it doesn't exist
  if (!fs.existsSync(modulesDir)) {
    fs.mkdirSync(modulesDir, { recursive: true });
  }

  // Generate module files for each table
  tables.forEach((tableName) => {
    const modulePath = path.join(modulesDir, `${tableName}.ts`);

    // Skip if file already exists
    if (fs.existsSync(modulePath)) {
      console.log(`Module for ${tableName} already exists, skipping...`);
      return;
    }

    const content = generateModuleContent(tableName);
    fs.writeFileSync(modulePath, content);
    console.log(`Generated module for ${tableName}`);
  });

  // Update main index.ts
  updateMainIndex(tables);
};

// Run the generator
generateModules();
