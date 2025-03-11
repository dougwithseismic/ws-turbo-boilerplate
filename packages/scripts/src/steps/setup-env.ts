import { readFile, writeFile } from "fs/promises";
import chalk from "chalk";
import path from "path";
import { ROOT_DIR, findFiles } from "../utils";

export const setupEnvFiles = async (): Promise<void> => {
  console.log(chalk.blue("\nSetting up environment files..."));

  // Look for .env.example files in root, apps/*, and packages/*
  const envExampleFiles = await findFiles([
    ".env.example",
    "apps/*/.env.example",
    "packages/*/.env.example",
  ]);

  if (envExampleFiles.length === 0) {
    console.log(chalk.yellow("! No .env.example files found"));
    return;
  }

  let setupCount = 0;
  for (const exampleFile of envExampleFiles) {
    try {
      const targetFile = exampleFile.replace(/\.example$/, "");
      const relativePath = path.relative(ROOT_DIR, targetFile);

      // Check if .env already exists
      try {
        await readFile(targetFile, "utf-8");
        console.log(
          chalk.yellow(`! Skipping ${relativePath} (already exists)`),
        );
        continue;
      } catch (error) {
        if ((error as { code?: string }).code !== "ENOENT") {
          throw error;
        }
      }

      // Copy .env.example to .env
      const content = await readFile(exampleFile, "utf-8");
      await writeFile(targetFile, content, "utf-8");
      console.log(chalk.green(`✓ Created ${relativePath}`));
      setupCount++;
    } catch (error) {
      console.error(
        chalk.red(
          `✗ Error setting up ${path.relative(ROOT_DIR, exampleFile)}:`,
        ),
        error,
      );
    }
  }

  if (setupCount > 0) {
    console.log(chalk.blue(`\nCreated ${setupCount} environment files.`));
  }
};
