import { createClient } from "@/lib/supabase/server";
import DashboardReportsClient from "./DashboardReportsClient";

export default async function DashboardReports() {
  const supabase = await createClient();
  const { data: tickets } = await supabase
    .from("tickets")
    .select(
      "id, status, sla_breached, created_at, resolved_at, issue_types(name), suppliers(name), created_by, assigned_to"
    );

  const list = tickets ?? [];
  const resolvedList = list.filter((t) => t.resolved_at);
  const withinSla = resolvedList.filter((t) => !t.sla_breached);
  const breached = list.filter((t) => t.sla_breached);

  const byIssueType = {};
  const bySupplier = {};
  list.forEach((t) => {
    const it = t.issue_types?.name ?? "Other";
    byIssueType[it] = (byIssueType[it] ?? 0) + 1;
    const sup = t.suppliers?.name ?? "Other";
    bySupplier[sup] = (bySupplier[sup] ?? 0) + 1;
  });

  let avgResolutionHours = null;
  if (resolvedList.length > 0) {
    const totalMs = resolvedList.reduce(
      (acc, t) => acc + (new Date(t.resolved_at) - new Date(t.created_at)),
      0
    );
    avgResolutionHours = (totalMs / (1000 * 60 * 60 * resolvedList.length)).toFixed(1);
  }

  return (
    <DashboardReportsClient
      totalTickets={list.length}
      openTickets={list.filter((t) => !["resolved", "closed"].includes(t.status)).length}
      resolvedTickets={resolvedList.length}
      withinSlaCount={withinSla.length}
      breachedCount={breached.length}
      avgResolutionHours={avgResolutionHours}
      byIssueType={byIssueType}
      bySupplier={bySupplier}
    />
  );
}
