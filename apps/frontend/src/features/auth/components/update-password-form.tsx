"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export const UpdatePasswordForm = () => {
  const { updatePassword, loadingState, user } = useAuth();
  const [error, setError] = useState<Error | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const isLoading = loadingState === "progress";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const currentPassword = formData.get("currentPassword") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError(new Error("Passwords do not match"));
      return;
    }

    try {
      const result = await updatePassword({ currentPassword, password });
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error("Failed to update password:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to update password"),
      );
    }
  };

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Update Password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your current password and choose a new one
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="animate-in fade-in-50">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <motion.form
        onSubmit={handleSubmit}
        className="space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <input
          type="email"
          name="email"
          autoComplete="username"
          value={user?.email ?? ""}
          className="hidden"
          readOnly
        />
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              name="currentPassword"
              type={showPasswords ? "text" : "password"}
              required
              placeholder="Enter your current password"
              autoComplete="current-password"
              className="pr-10 transition-all duration-200"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
              onClick={() => setShowPasswords(!showPasswords)}
              disabled={isLoading}
            >
              {showPasswords ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="sr-only">
                {showPasswords ? "Hide passwords" : "Show passwords"}
              </span>
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPasswords ? "text" : "password"}
              required
              placeholder="Enter your new password"
              autoComplete="new-password"
              className="pr-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPasswords ? "text" : "password"}
              required
              placeholder="Confirm your new password"
              autoComplete="new-password"
              className="pr-10"
            />
          </div>
        </div>
        <motion.div
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
        >
          <Button
            type="submit"
            className="w-full relative cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-95"
            disabled={isLoading}
          >
            <span
              className={`flex items-center justify-center transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"}`}
            >
              {isLoading ? "Updating..." : "Update Password"}
            </span>
            {isLoading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </span>
            )}
          </Button>
        </motion.div>
        <motion.div
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
        >
          <Button
            asChild
            variant="ghost"
            className="w-full cursor-pointer hover:bg-secondary/10 transition-all duration-200"
          >
            <a href="/login">Back to login</a>
          </Button>
        </motion.div>
      </motion.form>
    </div>
  );
};
