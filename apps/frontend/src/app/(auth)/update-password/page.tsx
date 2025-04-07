"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { executeUpdatePassword } from "@/features/auth/actions/auth-actions";
import { useRouter } from "next/navigation"; // Use for redirection

// Schema with password confirmation
const UpdatePasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Specify the field where the error should appear
  });

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      // Only need to send the new password to the action
      const { error } = await executeUpdatePassword({
        password: value.password,
      });
      setIsLoading(false);

      if (error) {
        toast.error(error.message || "Failed to update password");
      } else {
        toast.success("Password updated successfully!");
        // Redirect to login or dashboard after successful update
        router.push("/login");
      }
    },
    // Use Zod schema for validation on change
    validators: {
      onChange: UpdatePasswordSchema,
    },
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="gap-2">
        <CardTitle className="text-2xl">Update Password</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your new password below.
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="flex flex-col"
      >
        <CardContent className="flex flex-col gap-4">
          <form.Field
            name="password"
            children={(field) => (
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={field.name}
                  className={field.state.meta.errors ? "text-destructive" : ""}
                >
                  New Password
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  required
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={isLoading}
                  className={
                    field.state.meta.errors
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                {field.state.meta.errors?.length ? (
                  <em className="text-xs text-destructive">
                    {field.state.meta.errors
                      .map((err: any) =>
                        typeof err === "string"
                          ? err
                          : err?.message || "Invalid input",
                      )
                      .join(", ")}
                  </em>
                ) : null}
              </div>
            )}
          />
          <form.Field
            name="confirmPassword"
            validators={{
              onChangeAsyncDebounceMs: 500,
              onChangeAsync: async ({ value, fieldApi }) => {
                const { password } = fieldApi.form.state.values;
                if (password !== value) {
                  throw new Error("Passwords do not match");
                }
              },
            }}
            children={(field) => (
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={field.name}
                  className={field.state.meta.errors ? "text-destructive" : ""}
                >
                  Confirm New Password
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  required
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={isLoading}
                  className={
                    field.state.meta.errors
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                {field.state.meta.errors?.length ? (
                  <em className="text-xs text-destructive">
                    {field.state.meta.errors
                      .map((err: any) =>
                        typeof err === "string"
                          ? err
                          : err?.message || "Invalid input",
                      )
                      .join(", ")}
                  </em>
                ) : null}
              </div>
            )}
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit || isSubmitting || isLoading}
              >
                {(isSubmitting || isLoading) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Password
              </Button>
            )}
          />
        </CardFooter>
      </form>
    </Card>
  );
}
