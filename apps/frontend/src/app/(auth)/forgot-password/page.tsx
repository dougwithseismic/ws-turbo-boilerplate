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
import { executeResetPassword } from "@/features/auth/actions/auth-actions";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(""); // To display success/info message

  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      setMessage(""); // Clear previous messages
      const { error } = await executeResetPassword({ email: value.email });
      setIsLoading(false);

      if (error) {
        toast.error(error.message || "Failed to send reset instructions");
      } else {
        setMessage(
          "If an account exists for this email, password reset instructions have been sent.",
        );
        form.reset(); // Clear the form on success
        toast.success("Reset instructions sent!");
      }
    },
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="gap-2">
        <CardTitle className="text-2xl">Forgot Password</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your email address below and we&apos;ll send you instructions to
          reset your password.
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
            name="email"
            children={(field) => (
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={field.name}
                  className={field.state.meta.errors ? "text-destructive" : ""}
                >
                  Email
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  placeholder="m@example.com"
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
        <CardFooter className="flex flex-col items-center gap-4">
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
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
                Send Reset Instructions
              </Button>
            )}
          />
        </CardFooter>
      </form>
    </Card>
  );
}
