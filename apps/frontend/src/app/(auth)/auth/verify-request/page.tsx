import { Metadata } from "next";
import { VerifyRequestForm } from "@/features/auth/components/verify-request-form";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your email address.",
};

export default function VerifyRequestPage() {
  return <VerifyRequestForm />;
}
