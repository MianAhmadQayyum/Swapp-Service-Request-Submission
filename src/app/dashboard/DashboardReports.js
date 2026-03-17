import { createClient } from "@/lib/supabase/server";
import DashboardReportsClient from "./DashboardReportsClient";

export default async function DashboardReports({ teamId }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_ticket_stats", {
    p_team_id: teamId || null,
  });

  if (error) throw new Error(error.message);
  if (!data) return null;

  return (
    <DashboardReportsClient
      total={data.total ?? 0}
      open={(data.in_progress ?? 0) + (data.waiting_for_supplier ?? 0) + (data.waiting_for_customer ?? 0)}
      resolved={data.resolved ?? 0}
      inProgress={data.in_progress ?? 0}
      waitingSupplier={data.waiting_for_supplier ?? 0}
      waitingCustomer={data.waiting_for_customer ?? 0}
      ticketsWithSla={data.tickets_with_sla ?? 0}
      withinSla={data.within_sla ?? 0}
      breachedSla={data.breached_sla ?? 0}
      breachedUnresolved={data.breached_unresolved ?? 0}
      avgResolutionHours={data.avg_resolution_hours ?? null}
      bySupplier={data.by_supplier ?? {}}
      byIssueType={data.by_issue_type ?? {}}
    />
  );
}
