"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { container, item } from "../animations/form-animations";
import { useAuth } from "../hooks/use-auth";
import { toast } from "sonner";

export const VerifyRequestForm = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email";
  const type = searchParams.get("type") || "signup";
  const [isLoading, setIsLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const { signInWithOtp } = useAuth();

  // Send another verification email
  const handleResend = async () => {
    if (!email || email === "your email") {
      toast.error("Email address not found");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signInWithOtp(email);
      if (result.error) {
        throw result.error;
      }
      setResent(true);
      toast.success("Verification email resent!");
    } catch (error) {
      console.error("Failed to resend verification email:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to resend verification email",
      );
    } finally {
      setIsLoading(false);
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
          Check your email
        </motion.h1>
        <motion.p className="text-sm text-muted-foreground">
          {type === "signup"
            ? "We sent a verification link to your email."
            : "Check your email for further instructions."}
        </motion.p>
      </motion.div>

      <motion.div variants={item} className="text-center">
        <p className="text-muted-foreground">
          We sent an email to{" "}
          <span className="font-semibold">{decodeURIComponent(email)}</span>.
          <br />
          Please check your inbox and follow the instructions to continue.
        </p>
      </motion.div>

      <motion.div variants={item}>
        <Button
          onClick={handleResend}
          disabled={isLoading || resent}
          className="w-full cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-95 relative"
        >
          <span
            className={`flex items-center justify-center transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"}`}
          >
            {resent ? "Email resent!" : "Resend verification email"}
          </span>
          {isLoading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </span>
          )}
        </Button>
      </motion.div>

      <motion.div variants={item}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full"
        >
          <Button
            asChild
            variant="outline"
            className="w-full cursor-pointer transition-all duration-200 hover:bg-secondary/10"
          >
            <Link href="/login">Back to Sign In</Link>
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
