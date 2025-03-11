import { readFile, writeFile } from "fs/promises";
import { execSync } from "child_process";
import chalk from "chalk";
import path from "path";
import { ROOT_DIR } from "../utils";

export const setupHusky = async (): Promise<void> => {
  console.log(chalk.blue("\nSetting up Husky and lint-staged..."));

  try {
    // Install husky and lint-staged
    console.log(chalk.blue("Installing husky and lint-staged..."));
    execSync("pnpm add -Dw husky lint-staged", {
      stdio: "inherit",
      cwd: ROOT_DIR,
    });

    // Initialize husky
    console.log(chalk.blue("Initializing husky..."));
    execSync("pnpm husky install", { stdio: "inherit", cwd: ROOT_DIR });

    // Add husky install to prepare script in root package.json
    const pkgJsonPath = path.join(ROOT_DIR, "package.json");
    const pkgJson = JSON.parse(await readFile(pkgJsonPath, "utf-8"));

    if (!pkgJson.scripts) pkgJson.scripts = {};
    pkgJson.scripts.prepare = "husky";

    // Add lint-staged configuration
    pkgJson["lint-staged"] = {
      "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
      "*.{json,md,yml,yaml}": ["prettier --write"],
    };

    await writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2));

    // Create pre-commit hook
    const huskyDir = path.join(ROOT_DIR, ".husky");
    const preCommitPath = path.join(huskyDir, "pre-commit");
    const preCommitContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
`;

    await writeFile(preCommitPath, preCommitContent, { mode: 0o755 });
    console.log(chalk.green("✓ Husky and lint-staged setup completed"));
  } catch (error) {
    console.error(
      chalk.red("✗ Error setting up Husky and lint-staged:"),
      error,
    );
    throw error;
  }
};
