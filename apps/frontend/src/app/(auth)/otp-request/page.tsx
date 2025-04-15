"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function OtpRequestPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabaseClient.auth.signInWithOtp({ email });
    setIsLoading(false);
    if (error) {
      toast.error(error.message || "Failed to send OTP");
    } else {
      toast.success("OTP sent! Check your email.");
      router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto mt-10">
      <CardHeader>
        <CardTitle>Sign in or Sign up with Email OTP</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="transition-all duration-200"
          />
          <Button
            type="submit"
            disabled={isLoading || !email}
            className="cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-95 relative"
          >
            <span
              className={`flex items-center justify-center transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"}`}
            >
              Send OTP
            </span>
            {isLoading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </span>
            )}
          </Button>
        </form>
        <div className="flex flex-col gap-2 mt-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full"
          >
            <Button asChild variant="outline" className="w-full cursor-pointer">
              <Link href="/login">Back to Sign In</Link>
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full"
          >
            <Button asChild variant="ghost" className="w-full cursor-pointer">
              <Link href="/register">Create a new account</Link>
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
