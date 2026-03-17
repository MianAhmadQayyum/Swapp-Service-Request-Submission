import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getCachedUser, getCachedProfile } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import { DEFAULT_ROLE, ROLE_LABELS, canAccessAdmin, canViewDashboard, isTeamMember } from "@/lib/constants/roles";

export default async function DashboardLayout({ children }) {
  const user = await getCachedUser();
  if (!user) redirect("/signin");

  const profile = await getCachedProfile();

  if (profile?.disabled) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/signin");
  }

  const role = profile?.role ?? DEFAULT_ROLE;

  // Display label: for team_member show team name; otherwise show role label
  const roleDisplay = isTeamMember(role)
    ? (profile?.teams?.name ?? "Team Member")
    : (ROLE_LABELS[role] ?? role);

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Swapp SR
            </Link>
            <nav className="flex gap-4">
              {canViewDashboard(role) && (
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/dashboard/tickets"
                className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
              >
                Tickets
              </Link>
              {canAccessAdmin(role) && (
                <Link
                  href="/dashboard/admin"
                  className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {profile?.name || user.email}
              <span className="ml-1 text-zinc-400 dark:text-zinc-500">· {roleDisplay}</span>
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
