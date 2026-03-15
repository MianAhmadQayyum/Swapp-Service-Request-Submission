import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TicketFilters from "./TicketFilters";
import TicketTable from "./TicketTable";

export default async function TicketsPage({ searchParams }) {
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
  const canCreateTickets = role === "customer_support" || role === "admin";

  let query = supabase
    .from("tickets")
    .select(
      `
      id,
      booking_id,
      status,
      priority,
      customer_name,
      team_assigned,
      sla_deadline,
      sla_breached,
      created_at,
      resolved_at,
      suppliers(name),
      issue_types(name),
      assigned_to
    `
    )
    .order("created_at", { ascending: false });

  if (role === "customer_support") {
    query = query.eq("created_by", user.id);
  } else if (role === "operations") {
    if (profile?.team) {
      const teamVal = profile.team.includes(",") || profile.team.includes(" ") ? `"${profile.team.replace(/"/g, '""')}"` : profile.team;
      query = query.or(`assigned_to.eq.${user.id},team_assigned.eq.${teamVal}`);
    } else {
      query = query.eq("assigned_to", user.id);
    }
  }

  const filter = searchParams?.filter;
  if (filter === "pending") {
    query = query.in("status", [
      "new",
      "assigned",
      "in_progress",
      "waiting_on_supplier",
      "waiting_on_customer",
    ]);
  } else if (filter === "assigned_to_me" && role !== "customer_support") {
    query = query.eq("assigned_to", user.id);
  } else if (filter === "sla_breaching") {
    query = query
      .in("status", [
        "new",
        "assigned",
        "in_progress",
        "waiting_on_supplier",
        "waiting_on_customer",
      ])
      .eq("sla_breached", false)
      .lt("sla_deadline", new Date(Date.now() + 30 * 60 * 1000).toISOString());
  } else if (filter === "high_priority") {
    query = query.in("priority", ["high", "urgent"]);
  }
  const supplierId = searchParams?.supplier;
  if (supplierId) query = query.eq("supplier_id", supplierId);

  const { data: tickets, error } = await query;

  const { data: suppliers } = await supabase.from("suppliers").select("id, name").order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Tickets</h2>
        {canCreateTickets && (
          <Link
            href="/dashboard/tickets/new"
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium py-2 px-4 text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            + New ticket
          </Link>
        )}
      </div>
      <TicketFilters currentFilter={filter} supplierId={supplierId} suppliers={suppliers ?? []} />
      {error ? (
        <p className="text-red-600 dark:text-red-400 text-sm">{error.message}</p>
      ) : (
        <TicketTable tickets={tickets ?? []} />
      )}
    </div>
  );
}
