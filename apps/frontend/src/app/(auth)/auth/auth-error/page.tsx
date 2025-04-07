"use client";

import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

// Using Suspense requires the component using searchParams to be separate
function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const defaultMessage = "An unexpected error occurred during authentication.";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Authentication Error</CardTitle>
        <CardDescription>
          Something went wrong during the authentication process.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Alert variant="destructive">
          <AlertDescription>{error || defaultMessage}</AlertDescription>
        </Alert>
        <Button asChild className="w-full">
          <Link href="/login">Back to Login</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={<div className="text-center">Loading error details...</div>}
    >
      <AuthErrorContent />
    </Suspense>
  );
}
