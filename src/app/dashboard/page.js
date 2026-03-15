import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardReports from "./DashboardReports";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, team")
    .eq("id", user.id)
    .single();
  const role = profile?.role ?? "customer_support";

  const ticketsQuery = supabase
    .from("tickets")
    .select("id, status, sla_deadline, sla_breached, priority, created_at, resolved_at");
  if (role === "customer_support") {
    ticketsQuery.eq("created_by", user.id);
  } else if (role === "operations") {
    if (profile?.team) {
      const teamVal = profile.team.includes(",") || profile.team.includes(" ") ? `"${profile.team.replace(/"/g, '""')}"` : profile.team;
      ticketsQuery.or(`assigned_to.eq.${user.id},team_assigned.eq.${teamVal}`);
    } else {
      ticketsQuery.eq("assigned_to", user.id);
    }
  }
  const { data: tickets } = await ticketsQuery;

  const total = tickets?.length ?? 0;
  const open = tickets?.filter((t) => !["resolved", "closed"].includes(t.status))?.length ?? 0;
  const resolved = tickets?.filter((t) => ["resolved", "closed"].includes(t.status))?.length ?? 0;
  const breaching =
    tickets?.filter(
      (t) =>
        t.sla_deadline &&
        !t.sla_breached &&
        !["resolved", "closed"].includes(t.status) &&
        new Date(t.sla_deadline) < new Date(Date.now() + 30 * 60 * 1000)
    )?.length ?? 0;

  const canCreateTickets = role === "customer_support" || role === "admin";
  const showReports = role === "operations_manager" || role === "admin";

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Total tickets</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{total}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Open</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{open}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Resolved</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{resolved}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">SLA breaching soon</p>
          <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{breaching}</p>
        </div>
      </div>
      <div className="flex gap-4 mb-6">
        {canCreateTickets && (
          <Link
            href="/dashboard/tickets/new"
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium py-2 px-4 text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            + New ticket
          </Link>
        )}
        <Link
          href="/dashboard/tickets"
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium py-2 px-4 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          View all tickets
        </Link>
      </div>
      {showReports && <DashboardReports />}
      <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="font-medium text-zinc-700 dark:text-zinc-300 hover:underline">
          ← Back to home
        </Link>
      </p>
    </>
  );
}
