"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Loader2 } from "lucide-react";

const COOLDOWN_TIME = 60; // 60 seconds

export const ResetPasswordForm = () => {
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const emailValue = formData.get("email") as string;
      if (!emailValue) {
        setError("Email is required");
        setIsLoading(false);
        return;
      }

      setEmail(emailValue);
      const result = await resetPassword({ email: emailValue });
      if (result.error) {
        throw result.error;
      }
      setSuccess(true);
      setCooldown(COOLDOWN_TIME);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await resetPassword({ email });
      if (result.error) {
        throw result.error;
      }
      setCooldown(COOLDOWN_TIME);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col space-y-4"
      >
        <Alert>
          <AlertDescription>
            Check your email for a password reset link
          </AlertDescription>
        </Alert>
        <div className="flex flex-col space-y-2">
          <motion.div
            whileTap={{ scale: cooldown > 0 || isLoading ? 1 : 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            <Button
              onClick={handleResend}
              disabled={cooldown > 0 || isLoading}
              variant="outline"
              className="w-full relative cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-95"
            >
              <span
                className={`flex items-center justify-center transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"}`}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend reset link"}
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
            <Button asChild variant="ghost" className="w-full cursor-pointer">
              <Link href="/login">Back to login</Link>
            </Button>
          </motion.div>
          <motion.div
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            <Button asChild variant="outline" className="w-full cursor-pointer">
              <Link href="/register">Create a new account</Link>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="grid gap-4"
    >
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-2">
        <Input
          id="email"
          placeholder="name@example.com"
          type="email"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          name="email"
          required
          disabled={isLoading}
          className="transition-all duration-200"
        />
      </div>
      <motion.div
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
      >
        <Button type="submit" disabled={isLoading} className="w-full relative">
          <span
            className={`flex items-center justify-center transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"}`}
          >
            Send reset link
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
        <Button asChild variant="ghost" className="w-full cursor-pointer">
          <Link href="/login">Back to login</Link>
        </Button>
      </motion.div>
      <motion.div
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
      >
        <Button asChild variant="outline" className="w-full cursor-pointer">
          <Link href="/register">Create a new account</Link>
        </Button>
      </motion.div>
    </motion.form>
  );
};
