import { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your password.",
};

export default function ForgotPasswordPage() {
  return <ResetPasswordForm />;
}
