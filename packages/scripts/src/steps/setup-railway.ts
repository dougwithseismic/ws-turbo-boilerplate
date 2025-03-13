import { execSync } from "child_process";
import inquirer from "inquirer";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import { processDirectory } from "../utils/env";
import { handleError } from "../utils/error";

export const setupRailway = async (): Promise<void> => {
  try {
    console.log(chalk.blue("\n🚂 Setting up Railway project..."));

    // Get the current GitHub repository URL
    let repoUrl;
    try {
      repoUrl = execSync("git config --get remote.origin.url", {
        encoding: "utf8",
      }).trim();
      console.log(chalk.blue(`\nDetected GitHub repository: ${repoUrl}`));
    } catch (error) {
      console.log(chalk.yellow("\n⚠️ Could not detect GitHub repository URL"));
      repoUrl = null;
    }

    const { setupType } = await inquirer.prompt([
      {
        type: "list",
        name: "setupType",
        message: "How would you like to set up Railway?",
        choices: [
          {
            name: "Initialize new Railway project",
            value: "init",
          },
          {
            name: "Link to existing Railway project",
            value: "link",
          },
        ],
      },
    ]);

    if (setupType === "init") {
      execSync("railway init", { stdio: "inherit" });

      if (repoUrl) {
        const { connectGithub } = await inquirer.prompt([
          {
            type: "confirm",
            name: "connectGithub",
            message:
              "Would you like to connect this Railway project to your GitHub repository?",
            default: true,
          },
        ]);

        if (connectGithub) {
          console.log(
            chalk.blue("\n🔗 Connecting Railway to GitHub repository..."),
          );
          execSync("railway link", { stdio: "inherit" });
        }
      }
    } else {
      execSync("railway link", { stdio: "inherit" });
    }

    const { addDatabase } = await inquirer.prompt([
      {
        type: "confirm",
        name: "addDatabase",
        message: "Would you like to add a database to your Railway project?",
        default: false,
      },
    ]);

    if (addDatabase) {
      execSync("railway add", { stdio: "inherit" });

      const { syncNow } = await inquirer.prompt([
        {
          type: "confirm",
          name: "syncNow",
          message:
            "Would you like to sync the new database's environment variables?",
          default: true,
        },
      ]);

      if (syncNow) {
        await syncRailwayEnv();
      } else {
        console.log(
          chalk.blue(
            "\n💡 Tip: You can sync environment variables later with:",
          ),
        );
        console.log(chalk.yellow("pnpm railway:sync-env"));
      }
    }

    console.log(chalk.green("\n✅ Railway setup completed successfully!"));
  } catch (error) {
    handleError("Railway setup", error);
  }
};

export const syncRailwayEnv = async (): Promise<void> => {
  try {
    console.log(chalk.blue("\n📥 Syncing Railway environment variables..."));

    console.log(chalk.blue("\nℹ️  Please select a service when prompted..."));
    execSync("railway service", { stdio: "inherit" });

    const { envType } = await inquirer.prompt([
      {
        type: "list",
        name: "envType",
        message: "Which environment would you like to sync to?",
        choices: [
          {
            name: "Local Development (.env.local)",
            value: "local",
          },
          {
            name: "Production (.env.production)",
            value: "production",
          },
          {
            name: "Both environments",
            value: "both",
          },
        ],
        default: "local",
      },
    ]);

    try {
      const isWindows = process.platform === "win32";
      const envCommand = isWindows ? "set" : "printenv";
      const grepCommand = isWindows
        ? 'findstr /R /C:"^RAILWAY_" /C:"^POSTGRES_" /C:"^DATABASE_" /C:"^REDIS_" /C:"^MONGO_" /C:"^MONGODB_" /C:"^MYSQL_"'
        : "grep -E '^(RAILWAY_|POSTGRES_|DATABASE_|REDIS_|MONGO_|MONGODB_|MYSQL_)'";

      const rootEnvContent = execSync(
        `railway run ${envCommand} | ${grepCommand}`,
        {
          encoding: "utf8",
          windowsHide: true,
        },
      );

      // Process root directory
      processDirectory(process.cwd(), rootEnvContent, envType);

      // Handle apps directory
      const appsDir = path.join(process.cwd(), "apps");
      if (fs.existsSync(appsDir)) {
        const apps = fs
          .readdirSync(appsDir)
          .filter((app) => fs.statSync(path.join(appsDir, app)).isDirectory());

        for (const app of apps) {
          const appDir = path.join(appsDir, app);
          processDirectory(appDir, rootEnvContent, envType);
        }
      }

      console.log(chalk.blue("\n💡 Tip: To sync another service's variables:"));
      console.log(chalk.yellow("1. Run 'railway service' to switch services"));
      console.log(
        chalk.yellow(
          "2. Run 'pnpm railway:sync-env' again to add its variables",
        ),
      );

      if (envType !== "both") {
        console.log(chalk.blue("\n💡 Tip: To sync to another environment:"));
        console.log(
          chalk.yellow(
            "Run 'pnpm railway:sync-env' again and select a different environment",
          ),
        );
      }
    } catch (error) {
      console.log(
        chalk.yellow(
          "\n⚠️ Could not create or update some .env files. You may need to create them manually.",
        ),
      );
      throw error;
    }
  } catch (error) {
    handleError("Railway environment sync", error);
  }
};
