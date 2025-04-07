import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Auth Callback Error:", error.message);
    // Redirect to an error page with a message
    const errorUrl = new URL("/auth/auth-error", origin);
    errorUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(errorUrl);
  }

  // return the user to an error page with instructions
  console.error("Auth Callback Error: No code provided");
  const errorUrl = new URL("/auth/auth-error", origin);
  errorUrl.searchParams.set(
    "error",
    "Authorization code missing. Please try logging in again.",
  );
  return NextResponse.redirect(errorUrl);
}
