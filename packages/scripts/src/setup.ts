import { cloneEnvFiles, renamePackages, setupPorts } from "./steps";
import {
  validateScope,
  type RenameConfig,
  type SetupStep,
  type SetupOptions,
} from "./types";
import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Executes a shell command with a timeout to prevent hanging.
 * @param {string} command - The command to execute.
 * @param {string} description - A description of the command being run.
 * @param {string} [cwd] - Optional current working directory for the command.
 * @param {number} [timeoutMs=30000] - Timeout in milliseconds (default: 30 seconds).
 * @returns {boolean} - Whether the command executed successfully.
 */
function runCommandWithTimeout(
  command: string,
  description: string,
  cwd?: string,
  timeoutMs: number = 30000,
): boolean {
  console.log(chalk.blue(`\nRunning: ${description}...`));
  console.log(chalk.cyan(`> ${command}`));
  console.log(chalk.gray(`  (Timeout: ${timeoutMs / 1000}s)`));

  try {
    execSync(command, {
      stdio: "inherit",
      cwd: cwd || process.cwd(),
      timeout: timeoutMs,
    });
    console.log(chalk.green(`\n✓ ${description} completed successfully.`));
    return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.signal === "SIGTERM" || error.code === "ETIMEDOUT") {
      console.error(
        chalk.red(`\n✗ ${description} timed out after ${timeoutMs / 1000}s`),
      );
    } else {
      console.error(chalk.red(`\n✗ Error running ${description}:`));
    }
    console.error(chalk.yellow("Command failed, but continuing with setup."));
    return false;
  }
}

/**
 * Checks if Docker is running.
 * Exits the process with an error message if Docker is not responsive.
 */
function checkDockerStatus(): void {
  console.log(chalk.blue("Checking if Docker is running..."));
  try {
    execSync("docker ps -q", { stdio: "ignore", timeout: 10000 });
    console.log(chalk.green("✓ Docker appears to be running."));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(
      chalk.red(
        "Error: Docker does not seem to be running or is unresponsive.",
      ),
      error,
    );
    console.log(
      chalk.yellow(
        "Please start Docker Desktop (or your Docker daemon) and ensure it's running correctly.",
      ),
    );
    console.log(chalk.yellow("Then, run this script again."));
    process.exit(1); // Exit if Docker check fails
  }
}

// --- Helper Functions from provided script --- END

const program = new Command();

const setupSteps: SetupStep[] = [
  {
    name: "Clone environment files",
    value: "clone-env",
    checked: true,
    description:
      "Clones .env.example files to .env in apps/* if they don't exist",
  },
  {
    name: "Rename packages",
    value: "rename-packages",
    checked: true,
    description:
      "Updates all package names, imports, and scripts to use your scope",
  },
  {
    name: "Setup Supabase ports",
    value: "setup-ports",
    checked: true,
    description: "Finds free ports and updates Supabase config",
  },
  {
    name: "Setup Supabase (Local)",
    value: "setup-supabase-local",
    checked: false,
    description:
      "Builds Supabase package, generates keys, and checks status (requires Docker)",
  },
];

const showBanner = () => {
  console.log(
    chalk.blue(`
  ░██████╗███████╗████████╗██╗░░░██╗██████╗░
  ██╔════╝██╔════╝╚══██╔══╝██║░░░██║██╔══██╗
  ╚█████╗░█████╗░░░░░██║░░░██║░░░██║██████╔╝
  ░╚═══██╗██╔══╝░░░░░██║░░░██║░░░██║██╔═══╝░
  ██████╔╝███████╗░░░██║░░░╚██████╔╝██║░░░░░
  ╚═════╝░╚══════╝░░░╚═╝░░░░╚═════╝░╚═╝░░░░░

  [Starting installation sequence...]
  `),
  );
};

const promptForScope = async (): Promise<RenameConfig> => {
  const { newScope } = await inquirer.prompt([
    {
      type: "input",
      name: "newScope",
      message: "Enter your new package scope (e.g. @myorg):",
      default: "@withSeismic",
      validate: (input: string) => {
        if (!validateScope(input)) {
          return "Scope must start with @ and contain only alphanumeric characters, hyphens, and underscores";
        }
        return true;
      },
    },
  ]);

  return {
    oldScope: "@withSeismic",
    newScope,
  };
};

const setupSupabaseLocal = async () => {
  console.log(chalk.blue("\n🐳 Setting up Supabase for local development..."));

  checkDockerStatus(); // Check if Docker is running first

  const supabasePackageDir = path.resolve(__dirname, "../../supabase"); // Adjust path if needed

  if (!fs.existsSync(supabasePackageDir)) {
    console.error(
      chalk.red(
        `\n✗ Supabase package directory not found at: ${supabasePackageDir}`,
      ),
    );
    console.log(
      chalk.yellow(
        "  Skipping Supabase local setup. Ensure the path is correct.",
      ),
    );
    return; // Don't exit, just skip this step
  }

  // Check if supabase package exists in packages folder
  const packagesDir = path.resolve(__dirname, "../../");
  const supabasePackagePath = path.join(packagesDir, "supabase");

  if (!fs.existsSync(supabasePackagePath)) {
    console.warn(
      chalk.yellow(
        `\n⚠️ Supabase package not found at ${supabasePackagePath}. Skipping Supabase local setup.`,
      ),
    );
    return;
  }

  // Ensure dependencies are installed in the Supabase package directory
  console.log(
    chalk.blue(
      `\nEnsuring dependencies are installed in ${supabasePackageDir}...`,
    ),
  );
  runCommandWithTimeout(
    "pnpm install",
    "Installing Supabase package dependencies",
    supabasePackageDir,
    180000, // 3 minute timeout
  );

  // Build Supabase package first before doing any operations
  runCommandWithTimeout(
    "pnpm build",
    "Building Supabase package",
    supabasePackageDir,
    240000, // 4 minute timeout
  );

  // Setup ports for Supabase
  console.log(chalk.blue("\nConfiguring ports for Supabase..."));
  try {
    await setupPorts();
  } catch (error) {
    console.warn(
      chalk.yellow(
        "\n⚠️ Could not set up ports for Supabase. Will use default ports instead.",
      ),
      error,
    );
  }

  // Check if Supabase is already running before attempting to stop
  console.log(chalk.blue("\nChecking current Supabase status..."));
  const isRunning = runCommandWithTimeout(
    "npx supabase status",
    "Checking if Supabase is already running",
    supabasePackageDir,
    15000, // 15 second timeout
  );

  // Only attempt to stop if we can confirm it's running
  if (isRunning) {
    console.log(chalk.blue("\nStopping any running Supabase services..."));
    const stopped = runCommandWithTimeout(
      "npx supabase stop",
      "Stopping Supabase services",
      supabasePackageDir,
      30000, // 30 second timeout
    );

    if (!stopped) {
      console.log(
        chalk.yellow(
          "⚠️ Could not stop Supabase services cleanly. This might be normal if no services were running.",
        ),
      );
    }
  } else {
    console.log(
      chalk.gray(
        "No Supabase services detected or status check failed. Skipping stop step.",
      ),
    );
  }

  // Start Supabase with all services
  console.log(chalk.blue("\nStarting Supabase with all services..."));
  const startSuccessful = runCommandWithTimeout(
    "npx supabase start",
    "Starting Supabase services",
    supabasePackageDir,
    120000, // 2 minute timeout for start (can take longer)
  );

  if (!startSuccessful) {
    console.warn(
      chalk.yellow(
        "\nSkipping subsequent Supabase steps due to start failure.",
      ),
    );
    return; // Don't try gen:keys or status if start failed
  }

  // Generate Supabase keys with timeout
  runCommandWithTimeout(
    "pnpm run supabase:gen:keys",
    "Generating Supabase keys",
    supabasePackageDir,
    60000, // 1 minute timeout
  );

  // Final status check with timeout
  runCommandWithTimeout(
    "npx supabase status",
    "Checking final Supabase status",
    supabasePackageDir,
    15000, // 15 second timeout
  );

  // Update environment variables in all apps to match the Supabase setup
  console.log(chalk.blue("\nUpdating environment variables in apps..."));
  try {
    // Reuse the cloneEnvFiles functionality which now also updates environment variables
    await cloneEnvFiles();
  } catch (error) {
    console.warn(
      chalk.yellow(
        "\n⚠️ Could not update environment variables. You may need to manually update your .env files with the correct Supabase URL and ports.",
      ),
      error,
    );
  }

  console.log(
    chalk.green("\n✅ Supabase local setup steps completed successfully!"),
  );
};

const executeSteps = async (
  selectedSteps: string[],
  config: RenameConfig | null,
): Promise<void> => {
  for (const step of selectedSteps) {
    switch (step) {
      case "clone-env":
        await cloneEnvFiles();
        break;
      case "rename-packages":
        if (config) {
          await renamePackages(config);
          // Run pnpm install after renaming packages
          console.log(
            chalk.blue("🔄 Running pnpm install after renaming packages..."),
          );
          const installSuccessful = runCommandWithTimeout(
            "pnpm install",
            "Installing dependencies after package rename",
            undefined, // Use current directory
            180000, // 3 minute timeout for install
          );

          if (!installSuccessful) {
            console.error(
              chalk.red("❌ pnpm install failed after renaming packages."),
            );
            console.log(
              chalk.yellow("You may need to run 'pnpm install' manually."),
            );
          }
        }
        break;
      case "setup-ports":
        await setupPorts();
        break;
      case "setup-supabase-local":
        await setupSupabaseLocal();
        break;
    }
  }
};

export const setupProject = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options: SetupOptions = {},
): Promise<void> => {
  showBanner();

  try {
    // Initialize config to null
    let config: RenameConfig | null = null;

    const { steps } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "steps",
        message: "Select setup steps to execute:",
        choices: setupSteps.map((step) => ({
          name: `${step.name} (${step.description})`,
          value: step.value,
          checked: step.checked,
        })),
      },
    ]);

    if (steps.length === 0) {
      console.log(chalk.yellow("\n⚠️  No steps selected. Exiting...\n"));
      return;
    }

    // Prompt for scope only if rename step is selected
    if (steps.includes("rename-packages")) {
      config = await promptForScope();
    }

    console.log(chalk.blue("\n📦 Executing selected steps...\n"));
    await executeSteps(steps, config);
    console.log(chalk.green("\n✨ Project setup completed successfully!\n"));
  } catch (error) {
    console.error(chalk.red("\n❌ Project setup failed:"), error);
    process.exit(1);
  }
};

program
  .name("setup-project")
  .description("Interactive setup for the SDK project")
  .version("0.0.0")
  .action((options) => setupProject(options));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  program.parse();
}
