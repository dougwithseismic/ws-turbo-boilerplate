"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Loader2 } from "lucide-react";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Add state for other fields like full name if needed
  // const [fullName, setFullName] = useState('');
  const { signUp, loadingState } = useAuth();
  const isLoading = loadingState === "loading";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error } = await signUp({
      email,
      password,
      // fullName,
    });

    if (error) {
      toast.error(error.message || "Failed to sign up");
    } else {
      toast.success(
        "Registration successful! Please check your email to verify your account.",
      );
      // Optionally redirect to a verification pending page or login
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="gap-2">
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your information to create an account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <CardContent className="flex flex-col gap-4">
          {/* Add Full Name Input if needed */}
          {/* <div className="flex flex-col gap-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input id="full-name" placeholder="Your Name" required />
          </div> */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              minLength={6} // Enforce Supabase minimum password length
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="ml-1 font-medium text-primary hover:text-primary/90 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
