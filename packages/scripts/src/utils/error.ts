import chalk from "chalk";

export const handleError = (context: string, error: unknown): never => {
  if (error instanceof Error) {
    if (error.message.includes("railway: command not found")) {
      console.log(
        chalk.red(`\n❌ Railway CLI not found. Please install it first:`),
      );
      console.log(chalk.yellow("\nnpm install -g @railway/cli"));
      console.log(chalk.yellow("# or"));
      console.log(
        chalk.yellow("curl -fsSL https://railway.app/install.sh | sh"),
      );
    } else {
      console.error(chalk.red(`\n❌ ${context} failed:`), error.message);
    }
  } else {
    console.error(chalk.red(`\n❌ ${context} failed with an unknown error`));
  }
  process.exit(1);
};
