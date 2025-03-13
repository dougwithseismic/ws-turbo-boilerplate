import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";

export type EnvType = "local" | "production" | "both";

export const mergeEnvFiles = (envFile: string, newContent: string): void => {
  const existingVars = new Map();

  // Read existing variables if file exists
  if (fs.existsSync(envFile)) {
    const existing = fs.readFileSync(envFile, "utf8");
    existing.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=/);
      if (match) {
        existingVars.set(match[1], line);
      }
    });
  }

  // Add new variables
  newContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=/);
    if (match && !existingVars.has(match[1])) {
      existingVars.set(match[1], line);
    }
  });

  // Write back all variables
  const merged = Array.from(existingVars.values()).join("\n");
  fs.writeFileSync(envFile, merged + "\n");
};

export const createExampleFile = (envFile: string, content: string): void => {
  const exampleContent = content
    .split("\n")
    .map((line) => {
      const match = line.match(/^([^=]+)=/);
      return match ? `${match[1]}=` : line;
    })
    .join("\n");
  fs.writeFileSync(`${envFile}.example`, exampleContent + "\n");
};

export const processDirectory = (
  dir: string,
  envContent: string,
  envType: EnvType,
): void => {
  // Determine which files to update based on user choice
  const filesToUpdate = [];
  if (envType === "local" || envType === "both") {
    filesToUpdate.push(path.join(dir, ".env.local"));
  }
  if (envType === "production" || envType === "both") {
    filesToUpdate.push(path.join(dir, ".env.production"));
  }

  // Update each file
  for (const envFile of filesToUpdate) {
    mergeEnvFiles(envFile, envContent);
    console.log(chalk.green(`✅ Updated ${path.basename(envFile)} in ${dir}`));

    // Create example file if it doesn't exist
    const exampleFile = path.join(dir, ".env.example");
    if (!fs.existsSync(exampleFile)) {
      createExampleFile(envFile, envContent);
      console.log(
        chalk.green(`✅ Created ${path.basename(exampleFile)} in ${dir}`),
      );
    }
  }
};
