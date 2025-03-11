export type RenameConfig = {
  oldScope: string;
  newScope: string;
};

export const validateScope = (scope: string): boolean => {
  // Scope must start with @ and contain only alphanumeric characters, hyphens, and underscores
  return /^@[a-zA-Z0-9-_]+$/.test(scope);
};
