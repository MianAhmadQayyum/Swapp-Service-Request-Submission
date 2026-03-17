import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCachedUser, getCachedProfile, createClient } from "@/lib/supabase/server";
import DashboardReports from "./DashboardReports";
import DashboardTeamFilter from "./DashboardTeamFilter";
import { DEFAULT_ROLE, canViewDashboard, canAccessAdmin } from "@/lib/constants/roles";

export default async function DashboardPage({ searchParams }) {
  const user = await getCachedUser();
  if (!user) redirect("/signin");

  const profile = await getCachedProfile();
  const role = profile?.role ?? DEFAULT_ROLE;

  const showDashboard = canViewDashboard(role);

  const params = await searchParams;
  const teamId = canAccessAdmin(role) ? (params?.team ?? "") : "";

  const supabase = await createClient();
  const teams = canAccessAdmin(role)
    ? (await supabase.from("teams").select("id, name").order("name")).data ?? []
    : [];

  return (
    <>
      {teams.length > 0 && (
        <div className="mb-8">
          <DashboardTeamFilter teams={teams} currentTeamId={teamId} />
        </div>
      )}

      {showDashboard && (
        <Suspense fallback={
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
            ))}
          </div>
        }>
          <DashboardReports teamId={teamId} />
        </Suspense>
      )}

    </>
  );
}
