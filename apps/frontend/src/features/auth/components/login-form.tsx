"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { container, item } from "../animations/form-animations";
import { AuthForm } from "../forms/auth-form";
import type { AuthSubmitParams, AuthSubmitResult } from "../forms/types";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const { signIn, signInWithProvider, isLoading } = useAuth();
  const [isLockedOut, setIsLockedOut] = useState(false);

  const handleSignIn = async ({
    email,
    password,
  }: AuthSubmitParams): Promise<AuthSubmitResult> => {
    try {
      const result = await signIn({ email, password });
      return { error: result.error };
    } catch (err) {
      console.error("Failed to sign in:", err);
      const error = err instanceof Error ? err : new Error("Failed to sign in");
      return { error };
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithProvider("google");
    } catch (err) {
      console.error("Failed to sign in with Google:", err);
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
          Welcome back
        </motion.h1>
        <motion.p className="text-sm text-muted-foreground">
          Enter your email to sign in to your account
        </motion.p>
      </motion.div>

      <motion.div variants={item}>
        <AuthForm
          type="login"
          onSubmit={handleSignIn}
          isLoading={isLoading}
          onLockoutChange={setIsLockedOut}
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
          className="w-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-95 relative"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <span
            className={`flex items-center justify-center transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"}`}
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
            Sign in with Google
          </span>
          {isLoading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </span>
          )}
        </Button>
      </motion.div>

      <motion.div
        variants={item}
        className="flex flex-col space-y-2 text-center text-sm"
      >
        {isLockedOut ? (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button variant="default" className="w-full" asChild>
              <Link href="/forgot-password">Reset Your Password</Link>
            </Button>
          </motion.div>
        ) : (
          <motion.span
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-block"
          >
            <Link
              href="/forgot-password"
              className="text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
            >
              Forgot your password?
            </Link>
          </motion.span>
        )}
        <motion.span
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-block"
        >
          <Link
            href="/register"
            className="text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
          >
            Don&apos;t have an account? Sign Up
          </Link>
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
