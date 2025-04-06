import chalk from "chalk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Argument Parsing ---
const argv = yargs(hideBin(process.argv))
  .option("secret", {
    alias: "s",
    type: "string",
    description:
      "The secret key for encrypting .env files. If omitted, a new secret will be generated.",
    // demandOption: false, // Make it optional - removed demandOption: true
  })
  .usage("Usage: $0 [--secret <your-secret-key>]") // Updated usage
  .help()
  .alias("help", "h")
  .strict()
  .parseSync();

/**
 * Encrypts data using AES-256-GCM.
 * Derives a 32-byte key from the provided secret using SHA-256.
 * Generates a random 12-byte IV.
 * @param {string} text - The plaintext data to encrypt.
 * @param {string} secret - The encryption secret.
 * @returns {string} - The encrypted data in "iv:authTag:encryptedData" hex format.
 * @throws {Error} - If encryption fails.
 */
function encryptData(text, secret) {
  try {
    // Generate a random 12-byte IV (Initialization Vector) - crucial for security
    const iv = crypto.randomBytes(12);

    // Derive a 32-byte key from the secret using SHA-256 (must match decryption)
    const key = crypto.createHash("sha256").update(String(secret)).digest();

    if (key.length !== 32) {
      throw new Error("Derived key is not 32 bytes. Check hashing logic.");
    }

    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get the authentication tag (must be done after encryption)
    const authTag = cipher.getAuthTag();

    // Return IV, auth tag, and encrypted data, all hex-encoded and separated by colons
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error(chalk.red("  ✗ Encryption failed:"), error.message);
    throw error; // Re-throw to stop the process
  }
}

/**
 * Main function to find and encrypt .env files.
 * @param {string} secret - The encryption secret.
 */
function encryptEnvFiles(secret) {
  console.log(chalk.blue("Starting .env file encryption process..."));
  const appsDir = path.resolve(__dirname, "apps");
  let filesProcessed = 0;
  let filesEncrypted = 0;

  try {
    if (!fs.existsSync(appsDir)) {
      console.log(
        chalk.yellow(
          `  Directory not found: ${path.relative(__dirname, appsDir)}. No files to encrypt.`,
        ),
      );
      return;
    }

    const entries = fs.readdirSync(appsDir, { withFileTypes: true });
    const appDirs = entries
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => path.join(appsDir, dirent.name));

    console.log(
      chalk.cyan(`  Found ${appDirs.length} potential app directories.`),
    );

    appDirs.forEach((appDir) => {
      const envPath = path.join(appDir, ".env");
      const encryptedEnvPath = path.join(appDir, ".env.encrypted");
      const relativeEnvPath = path.relative(__dirname, envPath);
      const relativeEncryptedPath = path.relative(__dirname, encryptedEnvPath);
      const appName = path.basename(appDir);

      if (fs.existsSync(envPath)) {
        filesProcessed++;
        console.log(
          chalk.cyan(`  Processing ${relativeEnvPath} for [${appName}]...`),
        );
        try {
          const envContent = fs.readFileSync(envPath, "utf8");
          const encryptedContent = encryptData(envContent, secret);
          fs.writeFileSync(encryptedEnvPath, encryptedContent);
          console.log(
            chalk.green(
              `  ✓ Successfully encrypted and saved to ${relativeEncryptedPath}`,
            ),
          );
          filesEncrypted++;
        } catch (error) {
          // Error logged in encryptData, add context and continue if desired, or exit
          console.error(
            chalk.red(`  ✗ Failed to encrypt ${relativeEnvPath}. Stopping.`),
          );
          process.exit(1); // Exit on first encryption error
        }
      } else {
        // Optionally log if .env is missing
        // console.log(chalk.gray(`  Skipping [${appName}]: No ${relativeEnvPath} found.`));
      }
    });

    if (filesProcessed === 0) {
      console.log(
        chalk.yellow("No .env files found in any app directories to encrypt."),
      );
    } else {
      console.log(
        chalk.green(
          `✅ Encryption process completed. ${filesEncrypted} out of ${filesProcessed} found .env files were encrypted.`,
        ),
      );
    }
  } catch (error) {
    console.error(
      chalk.red(
        "✗ An unexpected error occurred during the encryption process:",
      ),
    );
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

// --- Determine or Generate Secret ---
let secretToUse = argv.secret;
let generatedSecret = null;

if (!secretToUse) {
  console.log(
    chalk.yellow("No --secret provided. Generating a new secure secret..."),
  );
  // Generate 32 random bytes and encode as hex for a 64-character string
  generatedSecret = crypto.randomBytes(32).toString("hex");
  secretToUse = generatedSecret;
  console.log(chalk.green("✓ New secret generated."));
} else {
  console.log(chalk.blue("Using provided --secret for encryption."));
}

// --- Run the encryption ---
encryptEnvFiles(secretToUse);

// --- Print Generated Secret if Applicable ---
if (generatedSecret) {
  console.log(chalk.bold.red("🚨 IMPORTANT: Security Alert 🚨"));
  console.log(
    chalk.yellow(
      "A new encryption secret was generated because none was provided.",
    ),
  );
  console.log(
    chalk.yellow(
      "You MUST save this secret securely. It is required to decrypt these files during setup.",
    ),
  );
  console.log(chalk.cyan("Generated Secret:"));
  console.log(chalk.bold.magenta(generatedSecret));
  console.log(
    chalk.yellow(
      "Store this secret safely (e.g., in a password manager) and use it with the initial-setup script:",
    ),
  );
  console.log(chalk.gray(`  pnpm setup:project --secret ${generatedSecret}`));
} else {
  console.log(chalk.blue("Encryption process used the provided secret key."));
}
