export type RenameConfig = {
  oldScope: string;
  newScope: string;
};

export type SetupStep = {
  name: string;
  value: SetupStepValue;
  checked: boolean;
  description: string;
};

export type SetupStepValue =
  | "clear-apps"
  | "rename-packages"
  | "setup-env"
  | "setup-husky"
  | "setup-template"
  | "setup-railway";

export type SetupOptions = {
  only?: "railway" | "railway-env";
};

export const validateScope = (scope: string): boolean => {
  // Scope must start with @ and contain only alphanumeric characters, hyphens, and underscores
  return /^@[a-zA-Z0-9-_]+$/.test(scope);
};
