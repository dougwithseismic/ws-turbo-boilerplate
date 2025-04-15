"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { exchangeCodeForSession } from "@/features/auth/actions/auth-actions";

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError("Authorization code missing. Please try logging in again.");
      setStatus("error");
      return;
    }
    (async () => {
      const { error } = await exchangeCodeForSession(code);
      if (error) {
        setError(error.message || "An unexpected error occurred.");
        setStatus("error");
      } else {
        // Give a short delay for UX polish
        setTimeout(() => {
          router.replace(next);
        }, 800);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, next]);

  if (status === "loading") {
    return (
      <Card className="w-full max-w-sm mx-auto mt-10 flex flex-col items-center">
        <CardHeader>
          <CardTitle>Signing you in…</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground text-center text-sm">
            Please wait while we complete your sign-in process.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  return (
    <Card className="w-full max-w-sm mx-auto mt-10 flex flex-col items-center">
      <CardHeader>
        <CardTitle>Authentication Error</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <p className="text-destructive text-center text-sm">{error}</p>
        <Button className="w-full" onClick={() => router.push("/login")}>
          Back to Login
        </Button>
      </CardContent>
    </Card>
  );
}
