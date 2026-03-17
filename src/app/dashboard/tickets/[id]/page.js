import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient, getCachedUser, getCachedProfile } from "@/lib/supabase/server";
import TicketDetailClient from "./TicketDetailClient";
import { STATUS_OPTIONS, STATUS_LABELS } from "@/lib/constants/tickets";
import { formatDate } from "@/lib/utils";
import { DEFAULT_ROLE, canUpdateTicket } from "@/lib/constants/roles";


export default async function TicketDetailPage({ params }) {
  const user = await getCachedUser();
  if (!user) redirect("/signin");
  const supabase = await createClient();

  const { id } = await params;

  const profile = await getCachedProfile();
  const role = profile?.role ?? DEFAULT_ROLE;

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select(
      `*, suppliers(title), issue_types!issue_category_id(title),
       cs_agent:profiles!cs_agent_id(name), teams!assignee_team_id(name)`
    )
    .eq("id", id)
    .single();

  if (error || !ticket) notFound();

  const canUpdate = canUpdateTicket(role);

  return (
    <div className="space-y-6">
      <div>
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
            Ticket — {ticket.booking_id}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {ticket.suppliers?.title} · {ticket.issue_types?.title} ·{" "}
            {STATUS_LABELS[ticket.status] ?? ticket.status}
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Booking ID</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">{ticket.booking_id}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Supplier</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">{ticket.suppliers?.title ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">CS Agent</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">{ticket.cs_agent?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Issue Category</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">{ticket.issue_types?.title ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Assigned Team</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">
                {ticket.teams?.name ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Escalated</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">
                {ticket.escalation_status ? (
                  <span className="text-red-600 dark:text-red-400 font-medium">Yes</span>
                ) : (
                  "No"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Service Request</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">
                {ticket.service_request_status ? "Yes" : "No"}
              </dd>
            </div>
            {ticket.service_request_status && (
              <>
                <div>
                  <dt className="text-zinc-500 dark:text-zinc-400">Car Plate</dt>
                  <dd className="text-zinc-900 dark:text-zinc-50">{ticket.car_plate || "—"}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500 dark:text-zinc-400">Odometer</dt>
                  <dd className="text-zinc-900 dark:text-zinc-50">{ticket.odometer || "—"}</dd>
                </div>
              </>
            )}
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Created</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">
                {formatDate(ticket.created_at)}
              </dd>
            </div>
            {ticket.resolved_at && (
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Resolved</dt>
                <dd className="text-zinc-900 dark:text-zinc-50">
                  {formatDate(ticket.resolved_at)}
                </dd>
              </div>
            )}
          </dl>

          <div>
            <dt className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Description</dt>
            <dd className="text-zinc-900 dark:text-zinc-50 whitespace-pre-wrap">
              {ticket.issue_description}
            </dd>
          </div>
        </div>
      </div>

      <TicketDetailClient
        ticketId={ticket.id}
        status={ticket.status}
        notes={ticket.notes ?? ""}
        canUpdate={canUpdate}
        statusOptions={STATUS_OPTIONS}
      />
    </div>
  );
}
