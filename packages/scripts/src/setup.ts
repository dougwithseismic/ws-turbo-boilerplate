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

// --- Helper Functions from provided script --- START

/**
 * Executes a shell command and streams the output.
 * @param {string} command - The command to execute.
 * @param {string} description - A description of the command being run.
 * @param {string} [cwd] - Optional current working directory for the command.
 */
function runCommand(command: string, description: string, cwd?: string): void {
  console.log(chalk.blue(`\nRunning: ${description}...`));
  console.log(chalk.cyan(`> ${command}`));
  try {
    execSync(command, { stdio: "inherit", cwd: cwd || process.cwd() });
    console.log(chalk.green(`\n✓ ${description} completed successfully.`));
  } catch (error) {
    console.error(chalk.red(`\n✗ Error running ${description}:`));
    console.error(
      chalk.red("Command failed. Please check the output above for details."),
    );
    process.exit(1); // Exit if command fails
  }
}

/**
 * Executes a shell command and streams the output, but doesn't exit on error.
 * @param {string} command - The command to execute.
 * @param {string} description - A description of the command being run.
 * @param {string} [cwd] - Optional current working directory for the command.
 * @returns {boolean} - Whether the command executed successfully.
 */
function runCommandWithFallback(
  command: string,
  description: string,
  cwd?: string,
): boolean {
  console.log(chalk.blue(`\nRunning: ${description}...`));
  console.log(chalk.cyan(`> ${command}`));
  try {
    execSync(command, { stdio: "inherit", cwd: cwd || process.cwd() });
    console.log(chalk.green(`\n✓ ${description} completed successfully.`));
    return true;
  } catch (error) {
    console.error(chalk.red(`\n✗ Error running ${description}:`));
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
    execSync("docker ps -q", { stdio: "ignore" });
    console.log(chalk.green("✓ Docker appears to be running."));
  } catch (error) {
    console.error(
      chalk.red(
        "Error: Docker does not seem to be running or is unresponsive.",
      ),
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
    description: "Updates all package names and imports to use your scope",
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
      message: "Enter your package scope (e.g. @myorg):",
      default: "@repo",
      validate: (input: string) => {
        if (!validateScope(input)) {
          return "Scope must start with @ and contain only alphanumeric characters, hyphens, and underscores";
        }
        return true;
      },
    },
  ]);

  return {
    oldScope: "@repo",
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
  runCommandWithFallback(
    "pnpm install",
    "Installing Supabase package dependencies",
    supabasePackageDir,
  );

  // Build Supabase package first before doing any operations
  runCommandWithFallback(
    "pnpm build",
    "Building Supabase package",
    supabasePackageDir,
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
    );
  }

  // Try to stop Supabase - don't exit if it fails
  console.log(chalk.blue("\nStopping any running Supabase services..."));
  try {
    execSync("npx supabase stop", {
      stdio: "inherit",
      cwd: supabasePackageDir,
    });
    console.log(chalk.green("✓ Successfully stopped Supabase services."));
  } catch (stopError) {
    console.log(
      chalk.yellow(
        "Note: Failed to stop Supabase services, but that's okay. Continuing...",
      ),
    );
  }

  // Start Supabase with all services
  console.log(chalk.blue("\nStarting Supabase with all services..."));
  const startSuccessful = runCommandWithFallback(
    "npx supabase start",
    "Starting Supabase services",
    supabasePackageDir,
  );

  if (!startSuccessful) {
    console.warn(
      chalk.yellow(
        "\nSkipping subsequent Supabase steps due to start failure.",
      ),
    );
    return; // Don't try gen:keys or status if start failed
  }

  runCommandWithFallback(
    "pnpm run supabase:gen:keys",
    "Generating Supabase keys",
    supabasePackageDir,
  );

  runCommandWithFallback(
    "npx supabase status",
    "Checking Supabase status",
    supabasePackageDir,
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
          try {
            execSync("pnpm install", { stdio: "inherit" });
            console.log(chalk.green("✓ pnpm install completed successfully."));
          } catch (error: any) {
            console.error(chalk.red("❌ pnpm install failed:"), error?.message);
            // Optionally re-throw or handle the error appropriately
            throw new Error("pnpm install failed after renaming packages.");
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
