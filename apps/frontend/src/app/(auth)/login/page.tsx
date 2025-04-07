import { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your account.",
};

export default function LoginPage() {
  return <LoginForm />;
}
