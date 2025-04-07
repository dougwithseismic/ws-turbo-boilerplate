"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { AuthForm } from "../forms/auth-form";
import { motion } from "framer-motion";
import { container, item } from "../animations/form-animations";
import { Button } from "@/components/ui/button";

export const RegisterForm = () => {
  const { signUp, signInWithProvider, isLoading } = useAuth();
  const [error, setError] = useState<Error | null>(null);

  const handleSignUp = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<{ error: Error | null }> => {
    try {
      const result = await signUp({ email, password });
      if (result.error) {
        setError(result.error);
      }
      return { error: result.error };
    } catch (err) {
      console.error("Failed to create account:", err);
      const error =
        err instanceof Error ? err : new Error("Failed to create account");
      setError(error);
      return { error };
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithProvider("google");
    } catch (err) {
      console.error("Failed to sign in with Google:", err);
      const error =
        err instanceof Error ? err : new Error("Failed to sign in with Google");
      setError(error);
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]"
    >
      <motion.div
        variants={item}
        className="flex flex-col space-y-2 text-center"
      >
        <motion.h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </motion.h1>
        <motion.p className="text-sm text-muted-foreground">
          Enter your email below to create your account
        </motion.p>
      </motion.div>

      {error && (
        <motion.div variants={item}>
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div variants={item}>
        <AuthForm
          type="register"
          onSubmit={handleSignUp}
          isLoading={isLoading}
        />
      </motion.div>

      <motion.div variants={item} className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <Button
          variant="outline"
          type="button"
          className="w-full flex items-center justify-center"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <svg
            className="mr-2 h-4 w-4"
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="google"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 488 512"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            ></path>
          </svg>
          Sign up with Google
        </Button>
      </motion.div>

      <motion.div variants={item} className="text-center text-sm">
        <motion.span
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-block"
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Link
            href="/login"
            className="text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
          >
            Already have an account? Sign In
          </Link>
        </motion.span>
      </motion.div>
    </motion.div>
  );
};
