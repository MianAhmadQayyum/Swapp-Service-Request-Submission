import Link from "next/link";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

function StatusBadge({ status }) {
  const styles = {
    new: "bg-zinc-200 dark:bg-zinc-600 text-zinc-800 dark:text-zinc-200",
    assigned: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200",
    in_progress: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200",
    waiting_on_supplier: "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200",
    waiting_on_customer: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-200",
    resolved: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200",
    closed: "bg-zinc-200 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-400",
  };
  const label = status?.replace(/_/g, " ") ?? "";
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || styles.new}`}
    >
      {label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const styles = {
    low: "text-zinc-500",
    medium: "text-zinc-700 dark:text-zinc-300",
    high: "text-amber-600 dark:text-amber-400",
    urgent: "text-red-600 dark:text-red-400 font-medium",
  };
  return (
    <span className={`text-xs capitalize ${styles[priority] || styles.medium}`}>
      {priority}
    </span>
  );
}

export default function TicketTable({ tickets }) {
  if (!tickets.length) {
    return (
      <p className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-12 text-center text-zinc-500 dark:text-zinc-400">
        No tickets match the current filters.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-700/50 text-left text-sm text-zinc-600 dark:text-zinc-300">
              <th className="px-6 py-3 font-medium">Booking / Customer</th>
              <th className="px-6 py-3 font-medium">Issue</th>
              <th className="px-6 py-3 font-medium">Priority</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">SLA</th>
              <th className="px-6 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {tickets.map((t) => (
              <tr key={t.id} className="text-sm">
                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/tickets/${t.id}`}
                    className="font-medium text-zinc-900 dark:text-zinc-50 hover:underline"
                  >
                    {t.booking_id}
                  </Link>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{t.customer_name ?? "—"}</div>
                </td>
                <td className="px-6 py-4">
                  {t.issue_types?.name ?? "—"}
                  {t.suppliers?.name && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{t.suppliers.name}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={t.status} />
                  {t.sla_breached && (
                    <span className="ml-1 text-xs text-red-600 dark:text-red-400">SLA breached</span>
                  )}
                </td>
                <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                  {t.sla_deadline ? formatDate(t.sla_deadline) : "—"}
                </td>
                <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                  {formatDate(t.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
