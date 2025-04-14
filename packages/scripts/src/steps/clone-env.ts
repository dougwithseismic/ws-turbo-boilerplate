import { copyFile, readdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import chalk from "chalk";
import path from "path";
import { ROOT_DIR } from "../utils";

/**
 * Updates Supabase-related environment variables in a .env file
 * to match the configured ports
 */
async function updateSupabaseEnvVars(envPath: string): Promise<boolean> {
  try {
    // Read the current .env file
    const content = await readFile(envPath, "utf-8");
    let updated = false;
    let newContent = content;

    // Read the Supabase config to get the current API port
    let apiPort = 54321; // Default port as fallback
    try {
      const configPath = path.join(
        ROOT_DIR,
        "packages/supabase/supabase/config.toml",
      );
      const configContent = await readFile(configPath, "utf-8");
      const apiPortMatch = configContent.match(
        /\[api\][\s\S]*?port\s*=\s*(\d+)/,
      );
      if (apiPortMatch && apiPortMatch[1]) {
        apiPort = parseInt(apiPortMatch[1], 10);
        console.log(chalk.cyan(`  Found Supabase API port: ${apiPort}`));
      }
    } catch (error) {
      console.log(
        chalk.yellow(
          "  Could not read Supabase config, using default API port 54321",
        ),
      );
    }

    // Update SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL if they exist
    if (
      newContent.includes("SUPABASE_URL=") ||
      newContent.includes("NEXT_PUBLIC_SUPABASE_URL=")
    ) {
      // Update standard SUPABASE_URL
      if (newContent.includes("SUPABASE_URL=")) {
        newContent = newContent.replace(
          /SUPABASE_URL=http:\/\/127\.0\.0\.1:\d+/g,
          `SUPABASE_URL=http://127.0.0.1:${apiPort}`,
        );
        updated = true;
      }

      // Update NEXT_PUBLIC_SUPABASE_URL
      if (newContent.includes("NEXT_PUBLIC_SUPABASE_URL=")) {
        newContent = newContent.replace(
          /NEXT_PUBLIC_SUPABASE_URL=http:\/\/127\.0\.0\.1:\d+/g,
          `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:${apiPort}`,
        );
        updated = true;
      }

      if (updated) {
        await writeFile(envPath, newContent, "utf-8");
        console.log(
          chalk.green(
            `  ✓ Updated Supabase URLs in ${path.relative(ROOT_DIR, envPath)} to use port ${apiPort}`,
          ),
        );
      }
    }

    return updated;
  } catch (error) {
    console.log(
      chalk.yellow(
        `  Could not update Supabase URLs in ${path.relative(ROOT_DIR, envPath)}`,
      ),
    );
    return false;
  }
}

/**
 * Clones .env.example files to .env in apps/* directories if they don't exist
 * and updates Supabase URLs to match configured ports
 */
export const cloneEnvFiles = async (): Promise<void> => {
  console.log(chalk.blue("📋 Cloning environment files..."));
  const appsDir = path.join(ROOT_DIR, "apps");

  try {
    if (!(await existsSync(appsDir))) {
      console.log(
        chalk.yellow(
          `  Directory not found: ${path.relative(ROOT_DIR, appsDir)}. Skipping .env cloning.`,
        ),
      );
      return;
    }

    const entries = await readdir(appsDir, { withFileTypes: true });
    const appDirs = entries
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => path.join(appsDir, dirent.name));

    let clonedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    for (const appDir of appDirs) {
      const exampleEnvPath = path.join(appDir, ".env.example");
      const envPath = path.join(appDir, ".env");
      const relativeExamplePath = path.relative(ROOT_DIR, exampleEnvPath);
      const relativeEnvPath = path.relative(ROOT_DIR, envPath);
      const appName = path.basename(appDir);

      let shouldUpdateEnvVars = false;

      if (await existsSync(exampleEnvPath)) {
        if (!(await existsSync(envPath))) {
          try {
            console.log(
              chalk.cyan(
                `  Cloning ${relativeExamplePath} to ${relativeEnvPath} for [${appName}]...`,
              ),
            );
            await copyFile(exampleEnvPath, envPath);
            console.log(
              chalk.green(
                `  ✓ Successfully cloned ${relativeExamplePath} to ${relativeEnvPath}`,
              ),
            );
            clonedCount++;
            shouldUpdateEnvVars = true;
          } catch (error: any) {
            console.error(
              chalk.red(
                `  ✗ Failed to clone ${relativeExamplePath} for [${appName}]: ${error.message}`,
              ),
            );
            throw error;
          }
        } else {
          console.log(
            chalk.yellow(
              `  Skipped cloning for [${appName}]: ${relativeEnvPath} already exists.`,
            ),
          );
          skippedCount++;
          shouldUpdateEnvVars = true; // Still update the variables in existing .env files
        }
      }

      // Update Supabase URLs in the .env file regardless of whether it was just created or already existed
      if (shouldUpdateEnvVars && (await existsSync(envPath))) {
        const updated = await updateSupabaseEnvVars(envPath);
        if (updated) {
          updatedCount++;
        }
      }
    }

    if (clonedCount === 0 && skippedCount === 0) {
      console.log(
        chalk.yellow("  No .env.example files found in any app directories."),
      );
    } else {
      if (clonedCount > 0) {
        console.log(
          chalk.green(`✅ Successfully cloned ${clonedCount} .env file(s).`),
        );
      }
      if (updatedCount > 0) {
        console.log(
          chalk.green(
            `✅ Updated Supabase URLs in ${updatedCount} .env file(s).`,
          ),
        );
      }
      if (skippedCount > 0) {
        console.log(
          chalk.yellow(
            `  (${skippedCount} .env file(s) already existed and were skipped from cloning.)`,
          ),
        );
      }
    }
  } catch (error: any) {
    console.error(
      chalk.red("✗ An unexpected error occurred while cloning .env files:"),
      error.message,
    );
    throw error;
  }
};
