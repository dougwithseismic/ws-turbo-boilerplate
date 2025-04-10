import fs from "fs";
import path from "path";
import chalk from "chalk";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

// Define paths relative to the script location
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const supabasePackageDir = path.resolve(__dirname, ".."); // Go up one level from scripts/ to packages/supabase/
const supabaseEnvPath = path.join(supabasePackageDir, ".env"); // Main supabase package .env
const rootDir = path.resolve(supabasePackageDir, "../../"); // Navigate up two levels to the monorepo root
const appsDir = path.join(rootDir, "apps"); // Path to the apps directory

/**
 * Adds or updates a variable in the .env file content.
 * @param {string} content - The current content of the .env file.
 * @param {string} key - The environment variable key (e.g., "SUPABASE_URL").
 * @param {string} value - The value for the environment variable.
 * @returns {string} The updated content.
 */
function addOrUpdateEnvVar(
  content: string,
  key: string,
  value: string,
): string {
  const regex = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}=${value}`;

  if (regex.test(content)) {
    // Update existing line
    return content.replace(regex, line);
  } else {
    // Add new line
    // Ensure there's a newline before adding, unless the content is empty
    const separator = content.trim().length > 0 ? "\n" : "";
    return content + separator + line;
  }
}

function runUpdateEnv(): void {
  try {
    // --- 1. Execute supabase status and extract keys ---
    console.log(chalk.cyan("🚀 Running 'npx supabase status'..."));
    let statusOutput: string;
    try {
      // Execute the command. Capture stdout. Handle potential errors.
      statusOutput = execSync("npx supabase status", {
        encoding: "utf8",
        stdio: "pipe",
        cwd: supabasePackageDir, // Run npx command from the supabase package directory
      });
      console.log(chalk.grey("Command output received."));
      // console.log(chalk.dim(statusOutput)); // Optional: Log raw output for debugging
    } catch (error: any) {
      console.error(chalk.red("❌ Error executing 'npx supabase status':"));
      // Log the stderr if available, otherwise the error message
      console.error(chalk.red(error?.stderr || error?.message));
      console.error(
        chalk.yellow(
          "Ensure Supabase CLI is installed and the local Supabase instance is running ('pnpm run supabase:start').",
        ),
      );
      process.exit(1);
    }

    // Extract keys using regex from the command output
    const apiUrlMatch = statusOutput.match(/^\s*API URL:\s*(.*)$/m);
    const anonKeyMatch = statusOutput.match(/^\s*anon key:\s*(.*)$/m);
    const serviceRoleKeyMatch = statusOutput.match(
      /^\s*service_role key:\s*(.*)$/m,
    );

    if (!apiUrlMatch?.[1] || !anonKeyMatch?.[1] || !serviceRoleKeyMatch?.[1]) {
      console.error(
        chalk.red(
          `Error: Could not parse API URL, anon key, or service_role key from 'npx supabase status' output.`,
        ),
      );
      console.error(chalk.yellow("Expected format not found in the output:"));
      console.error(chalk.grey(statusOutput)); // Log the output for debugging
      process.exit(1);
    }

    const supabaseUrl = apiUrlMatch[1].trim();
    const anonKeyValue = anonKeyMatch[1].trim();
    const serviceRoleKeyValue = serviceRoleKeyMatch[1].trim();
    console.log(
      chalk.green("✅ Successfully parsed keys from supabase status."),
    );
    console.log(chalk.blue(`   URL: ${supabaseUrl}`));
    console.log(chalk.blue(`   Anon Key: ${anonKeyValue.substring(0, 10)}...`)); // Show partial key for confirmation

    // --- 2. Update packages/supabase/.env ---
    const supabaseEnvContent = `# Local Development Only - Auto-generated by update-env.ts
SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${anonKeyValue}
SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKeyValue}

# Note: For production, set these values in your deployment environment
# DO NOT commit production keys to this file`;

    fs.writeFileSync(supabaseEnvPath, supabaseEnvContent);
    console.log(
      `\n✅ Successfully updated ${path.relative(
        rootDir,
        supabaseEnvPath,
      )} with local Supabase keys.`,
    );

    // --- 3. Add/Update .env files in apps/* ---
    console.log(
      `\n🔍 Processing .env files in ${path.relative(rootDir, appsDir)}/*/`,
    );

    // Ensure appsDir exists before reading
    if (!fs.existsSync(appsDir)) {
      console.log(
        chalk.yellow(
          `  Apps directory not found: ${appsDir}. Skipping apps/*.env update.`,
        ),
      );
    } else {
      const appEntries = fs.readdirSync(appsDir, { withFileTypes: true });
      const appDirs = appEntries
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => ({
          name: dirent.name,
          path: path.join(appsDir, dirent.name),
        }));

      appDirs.forEach((app) => {
        const appEnvPath = path.join(app.path, ".env");
        const relativeAppEnvPath = path.relative(rootDir, appEnvPath);

        if (fs.existsSync(appEnvPath)) {
          console.log(`  Processing ${relativeAppEnvPath}...`);
          try {
            let appEnvContent = fs.readFileSync(appEnvPath, "utf8");

            // Determine app type (simple heuristic based on name)
            const isFrontend =
              app.name.includes("frontend") || app.name.includes("web");
            const isBackend =
              app.name.includes("backend") || app.name.includes("api");

            // --- Update Logic ---
            let updated = false;
            const originalContent = appEnvContent; // Store original before modifications

            // Add/Update Supabase URL
            const urlKey = isFrontend ? "VITE_SUPABASE_URL" : "SUPABASE_URL";
            if (isFrontend || isBackend) {
              appEnvContent = addOrUpdateEnvVar(
                appEnvContent,
                urlKey,
                supabaseUrl,
              );
            }

            // Add/Update Anon Key
            const anonKey = isFrontend
              ? "VITE_SUPABASE_ANON_KEY"
              : "SUPABASE_ANON_KEY";
            if (isFrontend || isBackend) {
              appEnvContent = addOrUpdateEnvVar(
                appEnvContent,
                anonKey,
                anonKeyValue,
              );
            }

            // Add/Update Service Role Key (ONLY for backend)
            if (isBackend) {
              appEnvContent = addOrUpdateEnvVar(
                appEnvContent,
                "SUPABASE_SERVICE_ROLE_KEY",
                serviceRoleKeyValue,
              );
            }
            // --- End Update Logic ---

            // Check if changes were made
            if (appEnvContent !== originalContent) {
              updated = true;
              fs.writeFileSync(appEnvPath, appEnvContent);
              console.log(chalk.green(`    ✓ Updated ${relativeAppEnvPath}`));
            } else {
              console.log(
                chalk.grey(`    - No changes needed for ${relativeAppEnvPath}`),
              );
            }
          } catch (updateError: any) {
            console.error(
              chalk.red(`    ✗ Error processing ${relativeAppEnvPath}:`),
              updateError?.message,
            );
          }
        } else {
          console.log(
            chalk.yellow(`  Skipping: ${relativeAppEnvPath} not found.`),
          );
        }
      });
    }

    console.log(
      "\n✨ Successfully processed all relevant .env files with local Supabase keys.",
    );
  } catch (error: any) {
    // Catch errors from the main try block
    console.error(
      chalk.red("❌ An unexpected error occurred during the update process:"),
      error?.message || error,
    );
    process.exit(1);
  }
}

// Run the main function
runUpdateEnv();
