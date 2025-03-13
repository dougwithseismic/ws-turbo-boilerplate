import chalk from "chalk";
import path from "path";
import { ROOT_DIR } from "../utils";

export const clearApps = async (): Promise<void> => {
  console.log(chalk.blue("\nClearing apps/docs directory..."));

  try {
    const docsPath = path.join(ROOT_DIR, "apps/docs");
    await import("fs-extra").then((fs) => fs.remove(docsPath));
    console.log(chalk.green("✓ Removed apps/docs directory"));
  } catch (error) {
    if ((error as { code?: string }).code !== "ENOENT") {
      console.error(chalk.red("✗ Error removing apps/docs directory:"), error);
    } else {
      console.log(chalk.yellow("! apps/docs directory does not exist"));
    }
  }
};
