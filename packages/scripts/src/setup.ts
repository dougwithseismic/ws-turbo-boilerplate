import {
  renamePackages,
  decryptEnvFiles,
  setupRailway,
  syncRailwayEnv,
} from "./steps";
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
    name: "Rename packages",
    value: "rename-packages",
    checked: true,
    description: "Updates all package names and imports to use your scope",
  },
  {
    name: "Decrypt environment files",
    value: "decrypt-env",
    checked: true,
    description:
      "Decrypts .env.encrypted files to .env in apps/* if they don't exist",
  },
  {
    name: "Setup Railway",
    value: "setup-railway",
    checked: false,
    description: "Initialize or link Railway project and set up databases",
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

  runCommand(
    "pnpm build", // Assuming build script exists in supabase package.json
    "Building Supabase package",
    supabasePackageDir,
  );

  runCommand(
    "pnpm run supabase:start", // Start Supabase service
    "Starting Supabase service",
    supabasePackageDir,
  );

  runCommand(
    "pnpm run supabase:gen:keys", // Assuming this script exists
    "Generating Supabase keys",
    supabasePackageDir,
  );

  runCommand(
    "npx supabase status", // Run supabase CLI via npx
    "Checking Supabase status",
    supabasePackageDir,
  );

  console.log(
    chalk.green("\n✅ Supabase local setup steps completed successfully!"),
  );
};

const executeSteps = async (
  selectedSteps: string[],
  config: RenameConfig | null,
  secret?: string,
): Promise<void> => {
  for (const step of selectedSteps) {
    switch (step) {
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
      case "decrypt-env":
        if (!secret) {
          throw new Error(
            "Decryption step selected, but no --secret was provided.",
          );
        }
        await decryptEnvFiles(secret);
        break;
      case "setup-railway":
        await setupRailway();
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
  if (options.only === "railway-env") {
    try {
      await syncRailwayEnv();
      console.log(
        chalk.green("\n✨ Railway environment sync completed successfully!\n"),
      );
    } catch (error) {
      console.error(chalk.red("\n❌ Railway environment sync failed:"), error);
      process.exit(1);
    }
    return;
  }

  if (options.only === "railway") {
    try {
      await setupRailway();
      console.log(chalk.green("\n✨ Railway setup completed successfully!\n"));
    } catch (error) {
      console.error(chalk.red("\n❌ Railway setup failed:"), error);
      process.exit(1);
    }
    return;
  }

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
        // Ensure at least one step is selected if needed, or handle empty selection later
        // validate: (input) => input.length > 0 ? true : "Please select at least one step.",
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

    // --- Prompt for secret only if decrypt step is selected and secret not provided --- START
    let finalSecret = options.secret; // Use CLI secret if provided
    if (steps.includes("decrypt-env") && !finalSecret) {
      console.log(
        chalk.yellow(
          "\n🔒 The 'Decrypt environment files' step requires a secret key.",
        ),
      );
      const { secret } = await inquirer.prompt([
        {
          type: "password",
          name: "secret",
          message: "Enter the secret key to decrypt environment files:",
          mask: "*",
          validate: (input: string) => {
            if (!input) {
              return "Secret key cannot be empty.";
            }
            return true;
          },
        },
      ]);
      finalSecret = secret; // Use prompted secret
    }
    // --- Prompt for secret only if decrypt step is selected and secret not provided --- END

    console.log(chalk.blue("\n📦 Executing selected steps...\n"));
    // Pass the final secret (CLI option takes precedence over prompt)
    await executeSteps(steps, config, finalSecret);
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
  .option(
    "--only <step>",
    "Run only a specific setup step (railway or railway-env)",
  )
  .option(
    "-s, --secret <key>",
    "The secret key for decrypting .env.encrypted files",
  )
  .action((options) => setupProject(options));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  program.parse();
}
