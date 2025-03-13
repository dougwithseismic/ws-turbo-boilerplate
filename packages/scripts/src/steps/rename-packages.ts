import { readFile, writeFile } from "fs/promises";
import chalk from "chalk";
import path from "path";
import { ROOT_DIR, findFiles } from "../utils";
import type { RenameConfig } from "../types";

const updateFileContent = async (
  filePath: string,
  { oldScope, newScope }: RenameConfig,
): Promise<boolean> => {
  try {
    const content = await readFile(filePath, "utf-8");
    const oldContent = content;

    let newContent = content;

    // Handle Supabase config.toml project_id
    if (filePath.endsWith("config.toml")) {
      newContent = content.replace(
        /project_id = "supabase"/g,
        `project_id = "${newScope.replace("@", "")}"`,
      );
    } else {
      // Replace in JSON and code files
      newContent = content
        .replace(new RegExp(`"${oldScope}/([^"]+)"`, "g"), `"${newScope}/$1"`)
        .replace(
          new RegExp(`from "${oldScope}/([^"]+)"`, "g"),
          `from "${newScope}/$1"`,
        )
        .replace(
          new RegExp(`extends "${oldScope}/([^"]+)"`, "g"),
          `extends "${newScope}/$1"`,
        );
    }

    if (oldContent !== newContent) {
      await writeFile(filePath, newContent, "utf-8");
      console.log(
        chalk.green(`✓ Updated ${path.relative(ROOT_DIR, filePath)}`),
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error(
      chalk.red(`✗ Error updating ${path.relative(ROOT_DIR, filePath)}:`),
      error,
    );
    return false;
  }
};

export const renamePackages = async (config: RenameConfig): Promise<void> => {
  console.log(
    chalk.blue(
      `\nRenaming packages from ${config.oldScope} to ${config.newScope}...`,
    ),
  );

  const filesToSearch = await findFiles([
    "**/package.json",
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.jsx",
    "**/*.mjs",
    "**/*.cjs",
    "**/tsconfig.json",
    "**/config.toml",
  ]);

  let updatedCount = 0;
  for (const file of filesToSearch) {
    const wasUpdated = await updateFileContent(file, config);
    if (wasUpdated) updatedCount++;
  }

  console.log(chalk.blue(`\nUpdated ${updatedCount} files.`));
};
