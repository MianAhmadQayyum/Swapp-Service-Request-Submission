import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TicketDetailClient from "./TicketDetailClient";

const STATUSES = [
  "new",
  "assigned",
  "in_progress",
  "waiting_on_supplier",
  "waiting_on_customer",
  "resolved",
  "closed",
];

export default async function TicketDetailPage({ params }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { id } = await params;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = profile?.role ?? "customer_support";

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select(
      `
      *,
      suppliers(name),
      issue_types(name)
    `
    )
    .eq("id", id)
    .single();

  if (error || !ticket) notFound();

  let assignedName = null;
  if (ticket.assigned_to) {
    const { data: assignedProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", ticket.assigned_to)
      .single();
    assignedName = assignedProfile?.full_name ?? null;
  }

  const canUpdate =
    role === "operations" ||
    role === "operations_manager" ||
    role === "admin" ||
    (role === "customer_support" && ticket.created_by === user.id);

  const { data: updates } = await supabase
    .from("ticket_updates")
    .select("id, comment, created_at, added_by")
    .eq("ticket_id", id)
    .order("created_at", { ascending: false });

  const { data: profilesList } =
    role === "admin" || role === "operations_manager"
      ? await supabase
          .from("profiles")
          .select("id, full_name, role")
          .in("role", ["operations", "operations_manager"])
      : { data: [] };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/tickets"
          className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:underline"
        >
          ← Back to tickets
        </Link>
      </div>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Ticket {ticket.booking_id}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {ticket.suppliers?.name} · {ticket.issue_types?.name} ·{" "}
            {String(ticket.status).replace(/_/g, " ")}
            {ticket.sla_breached && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">· SLA breached</span>
            )}
          </p>
        </div>
        <div className="px-6 py-4 space-y-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Booking ID</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">{ticket.booking_id}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Priority</dt>
              <dd className="capitalize text-zinc-900 dark:text-zinc-50">{ticket.priority}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">CS Agent</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">{ticket.cs_agent ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Escalation Status</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">{ticket.escalation_status ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Service Request Opened</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">{ticket.service_request_opened ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Team Assigned</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">{ticket.team_assigned ?? "—"}</dd>
            </div>
            {ticket.service_request_opened === "Yes" && (
              <>
                <div>
                  <dt className="text-zinc-500 dark:text-zinc-400">Car Number Plate</dt>
                  <dd className="text-zinc-900 dark:text-zinc-50">{ticket.number_plate || "—"}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500 dark:text-zinc-400">Odometer reading (in case of service due)</dt>
                  <dd className="text-zinc-900 dark:text-zinc-50">{ticket.odometer_reading || "—"}</dd>
                </div>
              </>
            )}
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">SLA deadline</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">
                {ticket.sla_deadline
                  ? new Date(ticket.sla_deadline).toLocaleString()
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Assigned to</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">
                {assignedName ?? "Unassigned"}
              </dd>
            </div>
          </dl>
          <div>
            <dt className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Description</dt>
            <dd className="text-zinc-900 dark:text-zinc-50 whitespace-pre-wrap">{ticket.description}</dd>
          </div>
        </div>
      </div>

      <TicketDetailClient
        ticketId={ticket.id}
        status={ticket.status}
        canUpdate={canUpdate}
        statuses={STATUSES}
        updates={updates ?? []}
        assigneeId={ticket.assigned_to}
        assigneeName={assignedName}
        profilesList={profilesList ?? []}
        role={role}
      />
    </div>
  );
}
