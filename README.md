# Project Setup Scripts

This repository contains a set of automated setup scripts to help you quickly configure and customize your project. The scripts are built with TypeScript and provide an interactive CLI experience.

## Features

### 1. Interactive Setup Process

Run the complete setup with:

```bash
pnpm setup:project
```

This will guide you through:

- Package scope configuration (e.g., @myorg)
- Selection of setup steps to execute
- Visual feedback for each step

### 2. Available Setup Steps

#### Clear Apps Directory

- Removes the `apps/docs` directory if it exists
- Useful for cleaning up template documentation

#### Package Renaming

- Updates all package names from template scope (@repo) to your custom scope
- Modifies imports across the entire codebase
- Handles various file types: `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, etc.
- Updates Supabase configuration files

#### Environment Setup

- Automatically copies `.env.example` files to `.env`
- Searches in root, apps/_, and packages/_ directories
- Preserves existing .env files

#### Husky & Lint-Staged Configuration

- Installs and configures Husky for git hooks
- Sets up lint-staged for code quality checks
- Configures pre-commit hooks for:
  - ESLint fixes
  - Prettier formatting
  - Supports various file types (JS/TS, JSON, MD, YAML)

#### Template Updates

- Configures the original template as an upstream remote
- Enables future template updates via:

```bash
pnpm template:update
```

#### Railway Integration

- Interactive Railway.app setup
- Options for new or existing projects
- Database provisioning
- Environment variable synchronization

### 3. Railway-Specific Commands

#### Full Railway Setup

```bash
pnpm setup:railway
```

- Initialize or link Railway project
- Optional GitHub repository connection
- Database provisioning
- Environment variable sync

#### Environment Sync Only

```bash
pnpm railway:sync-env
```

- Sync Railway environment variables
- Choose between development/production environments
- Updates all relevant .env files

## Scripts Overview

| Script                  | Description                        |
| ----------------------- | ---------------------------------- |
| `pnpm setup:project`    | Run the complete interactive setup |
| `pnpm setup:railway`    | Railway-specific setup only        |
| `pnpm railway:sync-env` | Sync Railway environment variables |
| `pnpm template:update`  | Update from upstream template      |

## Requirements

- Node.js >= 18
- pnpm 9.0.0 or higher
- Git

## Environment Variables

The setup process handles various types of environment variables, including:

- Railway-specific variables
- Database credentials (Postgres, Redis, MongoDB, MySQL)
- Project-specific configurations

## Error Handling

All setup steps include:

- Comprehensive error reporting
- Graceful fallbacks
- Clear user feedback
- Non-destructive operations (won't overwrite existing configs)

## Contributing

When contributing to the setup scripts:

1. Maintain the modular structure in `packages/scripts/src`
2. Follow the established error handling patterns
3. Add clear console feedback for user actions
4. Test both Windows and Unix compatibility

## License

See the LICENSE file in the root directory.
