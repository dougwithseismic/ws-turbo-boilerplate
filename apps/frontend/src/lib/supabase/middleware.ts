import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Define paths that don't require authentication
const publicPaths = [
  "/", // Allow access to the home page
  "/login",
  "/register",
  "/forgot-password",
  "/update-password",
  "/auth/callback", // Supabase auth callback
  "/auth/auth-error", // Auth error page
  // Add any other public paths, like API routes if needed
];

// Define paths that authenticated users should NOT be able to access (e.g., login page)
const authOnlyPaths = ["/login", "/register", "/forgot-password"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { pathname } = request.nextUrl;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if the current path is public
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || (path !== "/" && pathname.startsWith(path)),
  );

  if (!user && !isPublicPath) {
    // Not logged in and trying to access a protected path
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    console.log(`Redirecting unauthenticated user from ${pathname} to /login`);
    return NextResponse.redirect(url);
  }

  if (user && authOnlyPaths.some((path) => pathname.startsWith(path))) {
    // Logged in user trying to access login/register/forgot-password pages
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard"; // Redirect to dashboard
    console.log(
      `Redirecting authenticated user from ${pathname} to /dashboard`,
    );
    return NextResponse.redirect(url);
  }

  // Refresh session and allow access
  return supabaseResponse;
}
