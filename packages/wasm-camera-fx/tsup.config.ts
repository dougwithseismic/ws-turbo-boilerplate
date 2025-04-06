import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  // Copy the wasm assets (effects.js, effects.wasm) to the dist folder
  publicDir: "wasm",
});
