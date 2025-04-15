"use client";
import React from "react";
import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-background">
      {/* Left column - Auth content */}
      <div className="flex w-full flex-col items-center justify-center px-4 sm:px-8 md:w-1/2">
        <div className="w-full max-w-sm pb-8">{children}</div>
      </div>

      {/* Right column - Just gradient background */}
      <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700" />
    </div>
  );
};

export default AuthLayout;
