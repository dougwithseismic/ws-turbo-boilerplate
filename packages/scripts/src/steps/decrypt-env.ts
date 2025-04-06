import { readFile, writeFile, readdir, stat } from "fs/promises";
import { existsSync } from "fs";
import chalk from "chalk";
import path from "path";
import crypto from "crypto";
import { ROOT_DIR } from "../utils"; // Assuming ROOT_DIR points to the project root

/**
 * Decrypts an AES-256-GCM encrypted string.
 * Assumes the input format is "iv:authTag:encryptedData" (hex encoded).
 * Derives a 32-byte key from the provided secret using SHA-256.
 * @param {string} encryptedText - The encrypted text string.
 * @param {string} secret - The decryption secret.
 * @returns {string} - The decrypted content.
 * @throws {Error} - If decryption fails or the format is invalid.
 */
function decryptData(encryptedText: string, secret: string): string {
  try {
    const [ivHex, authTagHex, encryptedDataHex] = encryptedText.split(":");

    if (!ivHex || !authTagHex || !encryptedDataHex) {
      throw new Error(
        `Invalid encrypted format. Expected iv:authTag:encryptedData (hex encoded).`,
      );
    }

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encryptedData = Buffer.from(encryptedDataHex, "hex");

    // Derive a 32-byte key from the secret using SHA-256 (must match encryption)
    const key = crypto.createHash("sha256").update(String(secret)).digest();

    // Validate IV length (should be 12 bytes for GCM standard)
    if (iv.length !== 12) {
      console.warn(
        chalk.yellow(
          `Warning: IV length is ${iv.length} bytes. Standard for AES-GCM is 12 bytes. Ensure compatibility with the encryption process.`,
        ),
      );
    }

    // Validate Key length (should be 32 bytes for AES-256)
    if (key.length !== 32) {
      throw new Error("Derived key is not 32 bytes. Check hashing logic.");
    }

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error: any) {
    // Log specific crypto errors if possible
    if (error.code === "ERR_CRYPTO_INVALID_AUTH_TAG") {
      console.error(
        chalk.red(
          `Authentication failed. Likely incorrect secret or corrupted data.`,
        ),
      );
    } else {
      console.error(chalk.red(`Error decrypting data:`), error.message);
    }
    throw error; // Re-throw to stop the process
  }
}

/**
 * Finds `.env.encrypted` files in specified app directories, decrypts them using the provided
 * secret, and writes the content to `.env` if it doesn't already exist.
 * @param {string} secret - The decryption secret.
 */
export const decryptEnvFiles = async (secret: string): Promise<void> => {
  console.log(chalk.blue("🔒 Decrypting environment files..."));
  const appsDir = path.join(ROOT_DIR, "apps"); // Use ROOT_DIR utility

  try {
    if (!(await existsSync(appsDir))) {
      console.log(
        chalk.yellow(
          `  Directory not found: ${path.relative(ROOT_DIR, appsDir)}. Skipping .env decryption.`,
        ),
      );
      return;
    }

    const entries = await readdir(appsDir, { withFileTypes: true });
    const appDirs = entries
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => path.join(appsDir, dirent.name));

    let decryptionAttempted = 0;
    let decryptionSucceeded = 0;
    let alreadyExists = 0;

    for (const appDir of appDirs) {
      const encryptedEnvPath = path.join(appDir, ".env.encrypted");
      const envPath = path.join(appDir, ".env");
      const relativeEncryptedPath = path.relative(ROOT_DIR, encryptedEnvPath);
      const relativeEnvPath = path.relative(ROOT_DIR, envPath);
      const appName = path.basename(appDir);

      if (await existsSync(encryptedEnvPath)) {
        decryptionAttempted++;
        if (!(await existsSync(envPath))) {
          try {
            console.log(
              chalk.cyan(
                `  Decrypting ${relativeEncryptedPath} for [${appName}]...`,
              ),
            );
            const encryptedContent = await readFile(encryptedEnvPath, "utf8");
            const decryptedContent = decryptData(encryptedContent, secret);
            await writeFile(envPath, decryptedContent);
            console.log(
              chalk.green(
                `  ✓ Successfully decrypted and created ${relativeEnvPath}`,
              ),
            );
            decryptionSucceeded++;
          } catch (error: any) {
            console.error(
              chalk.red(
                `  ✗ Failed to create ${relativeEnvPath} for [${appName}] due to decryption error: ${error.message}`,
              ),
            );
            console.error(
              chalk.red(
                "  Please verify the secret and the integrity of the encrypted file.",
              ),
            );
            throw new Error(`Decryption failed for ${relativeEncryptedPath}`); // Stop the whole process on error
          }
        } else {
          console.log(
            chalk.yellow(
              `  Skipped decryption for [${appName}]: ${relativeEnvPath} already exists.`,
            ),
          );
          alreadyExists++;
        }
      }
    }

    if (decryptionAttempted === 0) {
      console.log(
        chalk.yellow("  No .env.encrypted files found in any app directories."),
      );
    } else if (decryptionSucceeded > 0) {
      console.log(
        chalk.green(
          `✅ Successfully decrypted and created ${decryptionSucceeded} .env file(s).`,
        ),
      );
      if (alreadyExists > 0) {
        console.log(
          chalk.yellow(
            `  (${alreadyExists} .env file(s) already existed and were skipped.)`,
          ),
        );
      }
    } else if (alreadyExists > 0) {
      console.log(
        chalk.yellow(
          "⚠️  All found .env.encrypted files had corresponding .env files already present. No new files created.",
        ),
      );
    }
  } catch (error: any) {
    console.error(
      chalk.red(
        "✗ An unexpected error occurred while processing encrypted .env files:",
      ),
      error.message,
    );
    // Re-throw or handle as needed, potentially exiting
    throw error;
  }
};
