import { readFile, writeFile } from "fs/promises";
import { execSync } from "child_process";
import chalk from "chalk";
import path from "path";
import net from "net";
import { ROOT_DIR } from "../utils";

// Define the port ranges to use for Supabase services
const PORT_RANGES = {
  api: { start: 54000, end: 54100 },
  db: { start: 54101, end: 54200 },
  studio: { start: 54201, end: 54300 },
  inbucket: { start: 54301, end: 54400 },
  // Storage doesn't have its own port in config.toml
  pooler: { start: 54501, end: 54600 }, // DB pooler port
};

// Default ports used by Supabase for reference
const DEFAULT_PORTS = {
  api: 54329,
  db: 54322,
  studio: 54323,
  inbucket: 54324,
  pooler: 54329,
};

/**
 * Checks if a port is available
 */
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

/**
 * Finds an available port within a range
 */
async function findAvailablePort(
  startPort: number,
  endPort: number,
): Promise<number> {
  for (let port = startPort; port <= endPort; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found in range ${startPort}-${endPort}`);
}

/**
 * Updates the Supabase config.toml file with new port values
 */
async function updateConfigToml(
  configPath: string,
  ports: Record<string, number>,
): Promise<void> {
  try {
    let content = await readFile(configPath, "utf-8");
    const originalContent = content;
    let updated = false;

    // API Port
    if (ports.api) {
      const match = content.match(/\[api\][\s\S]*?port\s*=\s*(\d+)/);
      if (match) {
        content = content.replace(
          /(\[api\][\s\S]*?port\s*=\s*)(\d+)/,
          `$1${ports.api}`,
        );
        updated = true;
        console.log(chalk.cyan(`  Updated API port to ${ports.api}`));
      }
    }

    // DB Port
    if (ports.db) {
      const match = content.match(/\[db\][\s\S]*?port\s*=\s*(\d+)/);
      if (match) {
        content = content.replace(
          /(\[db\][\s\S]*?port\s*=\s*)(\d+)/,
          `$1${ports.db}`,
        );

        // Also update shadow port (db port - 2 is conventional)
        const shadowPort = ports.db - 2;
        content = content.replace(
          /(shadow_port\s*=\s*)(\d+)/,
          `$1${shadowPort}`,
        );

        updated = true;
        console.log(
          chalk.cyan(
            `  Updated DB port to ${ports.db} and shadow port to ${shadowPort}`,
          ),
        );
      }
    }

    // DB Pooler Port
    if (ports.pooler) {
      const match = content.match(/\[db\.pooler\][\s\S]*?port\s*=\s*(\d+)/);
      if (match) {
        content = content.replace(
          /(\[db\.pooler\][\s\S]*?port\s*=\s*)(\d+)/,
          `$1${ports.pooler}`,
        );
        updated = true;
        console.log(chalk.cyan(`  Updated DB pooler port to ${ports.pooler}`));
      }
    }

    // Studio Port
    if (ports.studio) {
      const match = content.match(/\[studio\][\s\S]*?port\s*=\s*(\d+)/);
      if (match) {
        content = content.replace(
          /(\[studio\][\s\S]*?port\s*=\s*)(\d+)/,
          `$1${ports.studio}`,
        );
        updated = true;
        console.log(chalk.cyan(`  Updated Studio port to ${ports.studio}`));
      }
    }

    // Inbucket Port
    if (ports.inbucket) {
      const match = content.match(/\[inbucket\][\s\S]*?port\s*=\s*(\d+)/);
      if (match) {
        content = content.replace(
          /(\[inbucket\][\s\S]*?port\s*=\s*)(\d+)/,
          `$1${ports.inbucket}`,
        );
        updated = true;
        console.log(chalk.cyan(`  Updated Inbucket port to ${ports.inbucket}`));
      }
    }

    // If any ports were updated, save the changes
    if (updated) {
      await writeFile(configPath, content, "utf-8");
      console.log(
        chalk.green("✓ Supabase config.toml updated with free ports"),
      );
    } else {
      console.warn(
        chalk.yellow(
          "⚠️ No port settings were updated in config.toml. Trying direct replacements...",
        ),
      );

      // Fallback to direct replacements of known default ports
      let directUpdated = false;

      for (const [service, port] of Object.entries(ports)) {
        const defaultPort =
          DEFAULT_PORTS[service as keyof typeof DEFAULT_PORTS];
        if (defaultPort && content.includes(`port = ${defaultPort}`)) {
          content = content.replace(
            new RegExp(`port = ${defaultPort}`, "g"),
            `port = ${port}`,
          );
          console.log(
            chalk.cyan(
              `  Directly replaced ${service} port ${defaultPort} with ${port}`,
            ),
          );
          directUpdated = true;
        }
      }

      if (directUpdated) {
        await writeFile(configPath, content, "utf-8");
        console.log(
          chalk.green(
            "✓ Supabase config.toml updated with free ports using direct replacement",
          ),
        );
      } else {
        console.warn(
          chalk.yellow("⚠️ Could not update any ports in config.toml file"),
        );
      }
    }
  } catch (error: any) {
    console.error(chalk.red(`✗ Error updating config.toml: ${error.message}`));
    throw error;
  }
}

/**
 * Stops any running Supabase containers
 */
function stopSupabaseContainers(): void {
  try {
    console.log(chalk.blue("Stopping any running Supabase containers..."));

    // Find and stop supabase containers
    const containersOutput = execSync("docker ps -f name=supabase -q", {
      encoding: "utf-8",
    }).trim();

    if (containersOutput) {
      execSync(`docker stop ${containersOutput}`, { stdio: "inherit" });
      console.log(chalk.green("✓ Supabase containers stopped"));
    } else {
      console.log(chalk.yellow("No running Supabase containers found"));
    }

    // Also attempt to stop any containers that might be using the common Supabase ports
    try {
      // Default Supabase ports
      const defaultPortsStr = Object.values(DEFAULT_PORTS).join(" -f expose=");
      const containersUsingPorts = execSync(
        `docker ps --format '{{.ID}}' -f 'expose=${defaultPortsStr}'`,
        { encoding: "utf-8" },
      ).trim();

      if (containersUsingPorts) {
        execSync(`docker stop ${containersUsingPorts}`, { stdio: "inherit" });
        console.log(
          chalk.green("✓ Other containers using Supabase ports stopped"),
        );
      }
    } catch (innerError) {
      // Ignore errors from this additional check
    }
  } catch (error) {
    console.log(
      chalk.yellow("Failed to stop Supabase containers, continuing anyway..."),
    );
  }
}

/**
 * Sets up free ports for Supabase and updates config.toml
 */
export const setupPorts = async (): Promise<void> => {
  console.log(chalk.blue("🔌 Setting up free ports for Supabase..."));

  // Note: Container stopping is now handled in setupSupabaseLocal
  // We no longer stop containers here to avoid the "supabase start is already running" issue

  const supabaseDir = path.join(ROOT_DIR, "packages/supabase");
  const configPath = path.join(supabaseDir, "supabase/config.toml");

  try {
    // Check if config.toml exists
    let configContent;
    try {
      configContent = await readFile(configPath, "utf-8");
      console.log(
        chalk.green(
          `✓ Found config.toml at ${path.relative(ROOT_DIR, configPath)}`,
        ),
      );
    } catch (err) {
      console.log(
        chalk.yellow(
          `config.toml not found at ${path.relative(ROOT_DIR, configPath)}. Skipping port setup.`,
        ),
      );
      return;
    }

    // Find available ports for each service
    const ports: Record<string, number> = {};
    console.log(chalk.blue("Finding available ports..."));

    for (const [service, range] of Object.entries(PORT_RANGES)) {
      try {
        ports[service] = await findAvailablePort(range.start, range.end);
        console.log(
          chalk.cyan(`  Found free port for ${service}: ${ports[service]}`),
        );
      } catch (error) {
        console.warn(
          chalk.yellow(
            `  Could not find free port for ${service}, will use default`,
          ),
        );
      }
    }

    if (Object.keys(ports).length === 0) {
      console.warn(
        chalk.yellow(
          "⚠️ Could not find any free ports. Will use default ports.",
        ),
      );
      return;
    }

    // Update config.toml with the new ports
    await updateConfigToml(configPath, ports);

    console.log(
      chalk.green("✅ Successfully configured free ports for Supabase"),
    );
  } catch (error: any) {
    console.error(
      chalk.red("✗ An error occurred while setting up Supabase ports:"),
      error.message,
    );
    throw error;
  }
};
