# @repo/scripts

This package contains setup and maintenance scripts for the Sniffle SDK monorepo.

## Available Scripts

### rename-packages

A utility for renaming package scopes throughout the monorepo. This is typically used during initial setup to change from the template's `@repo` scope to your project's scope.

```typescript
import { renamePackages, clearApps } from "@repo/scripts/rename-packages";

// Clear the docs app if it exists
await clearApps();

// Rename all @repo references to @repo
await renamePackages({
  oldScope: "@repo",
  newScope: "@repo",
});
```

#### Features

- Renames package scopes in:
  - package.json files (both package names and dependencies)
  - TypeScript/JavaScript imports
  - tsconfig.json extends paths
- Handles multiple file types:
  - .ts, .tsx
  - .js, .jsx
  - .mjs, .cjs
  - package.json
  - tsconfig.json
- Provides clear console output with:
  - Progress indicators
  - Success/failure messages
  - File update counts

#### Configuration

The `renamePackages` function accepts a configuration object:

```typescript
type RenameConfig = {
  oldScope: string; // The package scope to replace (e.g. '@repo')
  newScope: string; // The new package scope (e.g. '@repo')
};
```

The `clearApps` function:

- Removes the apps/docs directory if it exists
- Fails silently if the directory doesn't exist
- Reports errors for other failure cases
