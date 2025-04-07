import React from "react";
import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-4">
      <Link href="/" aria-label="Go to homepage">
        <div className="h-10 w-32 rounded bg-muted"></div>
      </Link>
      <main className="w-full max-w-sm">{children}</main>
    </div>
  );
};

export default AuthLayout;
