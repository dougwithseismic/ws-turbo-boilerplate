import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  target: "node18",
  clean: true,
  sourcemap: true,
  splitting: false,
  bundle: true,
  dts: false,
  esbuildOptions: (options) => {
    options.alias = {
      "@": "./src",
    };
  },
});
