import { renamePackages, clearApps, setupEnvFiles, setupHusky } from "./steps";
import { validateScope, type RenameConfig } from "./types";
import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import { fileURLToPath } from "url";

const program = new Command();

type SetupStep = {
  name: string;
  value: string;
  checked: boolean;
  description: string;
};

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
    }
  }
};

export const setupProject = async (): Promise<void> => {
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
  .action(setupProject);

// Allow running directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  program.parse();
}
