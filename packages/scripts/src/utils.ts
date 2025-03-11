import { glob } from "glob";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(__dirname, "../../../");

export const findFiles = async (patterns: string[]): Promise<string[]> => {
  const files = await Promise.all(
    patterns.map((pattern) =>
      glob(pattern, {
        cwd: ROOT_DIR,
        absolute: true,
        ignore: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
      }),
    ),
  );
  return files.flat();
};
