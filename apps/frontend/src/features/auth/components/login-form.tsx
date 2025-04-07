"use client";

import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export function LoginForm() {
  const { signIn, loadingState } = useAuth();
  const isLoading = loadingState === "loading";
  const [showPassword, setShowPassword] = useState(false);
  const [isErrorShaking, setIsErrorShaking] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setIsErrorShaking(false);
      const { email, password } = value;
      const { error } = await signIn({ email, password });

      if (error) {
        toast.error(error.message || "Failed to sign in");
        setIsErrorShaking(true);
        setTimeout(() => setIsErrorShaking(false), 500);
      } else {
        toast.success("Signed in successfully!");
        window.location.href = "/dashboard";
      }
    },
    validators: {
      onSubmit: LoginSchema,
    },
  });

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const shakeVariants = {
    shake: {
      x: [-8, 8, -8, 8, 0],
      transition: { duration: 0.4 },
    },
    initial: {
      x: 0,
    },
  };

  return (
    <motion.div
      className="w-full max-w-sm"
      variants={shakeVariants}
      animate={isErrorShaking ? "shake" : "initial"}
    >
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your email below to login to your account.
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
              validators={{
                onChange: LoginSchema.shape.email,
              }}
              children={(field) => (
                <div className="flex flex-col gap-2" key={field.name}>
                  <Label
                    htmlFor={field.name}
                    className={
                      field.state.meta.errors ? "text-destructive" : ""
                    }
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
            <form.Field
              name="password"
              validators={{
                onChange: LoginSchema.shape.password,
              }}
              children={(field) => (
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor={field.name}
                    className={
                      field.state.meta.errors ? "text-destructive" : ""
                    }
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id={field.name}
                      name={field.name}
                      type={showPassword ? "text" : "password"}
                      required
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isLoading}
                      className={`${field.state.meta.errors ? "border-destructive focus-visible:ring-destructive" : ""} pr-10`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-md text-muted-foreground hover:bg-transparent"
                      onClick={togglePasswordVisibility}
                      disabled={isLoading}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                  <div className="text-right text-sm">
                    <Link
                      href="/forgot-password"
                      className="underline hover:text-primary transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
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
                  Sign in
                </Button>
              )}
            />
            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="ml-1 font-medium text-primary hover:text-primary/90 transition-colors"
              >
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
