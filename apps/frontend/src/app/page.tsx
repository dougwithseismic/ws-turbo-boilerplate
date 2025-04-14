"use client"; // Need client component for useAuth

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import Link from "next/link";

export default function Home() {
  const { isAuthenticated, isLoading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut({ redirect: true, destinationUrl: "/" });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Zer0 TV Home</h1>
        <div className="flex gap-4">
          {isLoading ? (
            <Button variant="outline" disabled>
              Loading...
            </Button>
          ) : isAuthenticated ? (
            <>
              <Button asChild variant="outline">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button onClick={handleSignOut} variant="destructive">
                Sign Out
              </Button>
            </>
          ) : (
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
