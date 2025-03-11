import { renamePackages, clearApps, setupEnvFiles, setupHusky } from "./steps";
import { setupRailway, syncRailwayEnv } from "./steps/setup-railway";
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

const program = new Command();

const setupSteps: SetupStep[] = [
  {
    name: "Clear apps/docs directory",
    value: "clear-apps",
    checked: true,
    description: "Removes the apps/docs directory if it exists",
  },
  {
    name: "Rename packages",
    value: "rename-packages",
    checked: true,
    description: "Updates all package names and imports to use your scope",
  },
  {
    name: "Setup environment files",
    value: "setup-env",
    checked: true,
    description:
      "Copies .env.example files to .env in root, apps/*, and packages/*",
  },
  {
    name: "Setup Husky and lint-staged",
    value: "setup-husky",
    checked: true,
    description:
      "Configures git hooks with Husky and lint-staged for code quality checks",
  },
  {
    name: "Setup template upstream",
    value: "setup-template",
    checked: true,
    description:
      "Configures the original template repository as an upstream remote for future updates",
  },
  {
    name: "Setup Railway",
    value: "setup-railway",
    checked: false,
    description: "Initialize or link Railway project and set up databases",
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

const setupTemplateUpstream = async () => {
  try {
    console.log(
      chalk.blue("\n🔗 Setting up template repository as upstream remote..."),
    );

    // Add the template repository as a remote
    execSync(
      "git remote add template https://github.com/dougwithseismic/ws-turbo-boilerplate.git",
    );

    console.log(chalk.green("\n✅ Template upstream configured successfully!"));
    console.log(chalk.blue("\nTo get template updates in the future, run:"));
    console.log(chalk.yellow("git fetch template"));
    console.log(
      chalk.yellow("git merge template/main --allow-unrelated-histories"),
    );
  } catch (error) {
    if (error.message.includes("remote template already exists")) {
      console.log(chalk.yellow("\n⚠️ Template remote already configured"));
    } else {
      throw error;
    }
  }
};

const executeSteps = async (
  selectedSteps: string[],
  config: RenameConfig,
): Promise<void> => {
  for (const step of selectedSteps) {
    switch (step) {
      case "clear-apps":
        await clearApps();
        break;
      case "rename-packages":
        await renamePackages(config);
        break;
      case "setup-env":
        await setupEnvFiles();
        break;
      case "setup-husky":
        await setupHusky();
        break;
      case "setup-template":
        await setupTemplateUpstream();
        break;
      case "setup-railway":
        await setupRailway();
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
    // First, get the scope configuration
    const config = await promptForScope();

    // Then, select which steps to execute
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
  .option(
    "--only <step>",
    "Run only a specific setup step (railway or railway-env)",
  )
  .action((options) => setupProject(options));

// Allow running directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  program.parse();
}
