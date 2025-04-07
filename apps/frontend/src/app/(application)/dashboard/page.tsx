import { protectedRoute } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { executeSignOut } from "@/features/auth/actions/auth-actions";

// Server component to display user info and a logout button
export default async function DashboardPage() {
  const user = await protectedRoute("/login"); // Protect this page, redirect to /login if not authed
  const supabase = await createSupabaseServerClient();

  // Example: Fetch user profile data if you have a profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const handleSignOut = async () => {
    "use server";
    await executeSignOut();
    // Redirect is usually handled by middleware or client-side after state update
    // But we can explicitly redirect here if needed for server actions
    const { redirect } = await import("next/navigation");
    redirect("/login");
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="mb-2">Welcome, {profile?.full_name || user.email}!</p>
      <p className="mb-4 text-sm text-muted-foreground">User ID: {user.id}</p>

      <form action={handleSignOut}>
        <Button type="submit" variant="outline">
          Sign Out
        </Button>
      </form>
    </div>
  );
}
