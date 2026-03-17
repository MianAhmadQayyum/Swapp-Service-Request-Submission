import Link from "next/link";
import { formatDate } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";

function SortTh({ col, label, sort, dir, sortUrls }) {
  const active = sort === col;
  return (
    <th className="px-6 py-3 font-medium">
      <Link
        href={sortUrls[col]}
        className={`inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-50 ${active ? "text-zinc-900 dark:text-zinc-50" : ""}`}
      >
        {label}
        <span className="text-xs">
          {active ? (dir === "asc" ? "↑" : "↓") : <span className="opacity-30">↕</span>}
        </span>
      </Link>
    </th>
  );
}

export default function TicketTable({ tickets, sort, dir, sortUrls }) {
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
              <SortTh col="booking_id" label="Booking ID" sort={sort} dir={dir} sortUrls={sortUrls} />
              <th className="px-6 py-3 font-medium">Issue</th>
              <SortTh col="status" label="Status" sort={sort} dir={dir} sortUrls={sortUrls} />
              <th className="px-6 py-3 font-medium">Team</th>
              <th className="px-6 py-3 font-medium">Flags</th>
              <SortTh col="created_at" label="Created" sort={sort} dir={dir} sortUrls={sortUrls} />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {tickets.map((t) => (
              <tr key={t.id} className="text-sm relative hover:bg-zinc-50 dark:hover:bg-zinc-700/30 cursor-pointer">
                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/tickets/${t.id}`}
                    className="font-medium text-zinc-900 dark:text-zinc-50 after:absolute after:inset-0"
                  >
                    {t.booking_id}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span className="text-zinc-900 dark:text-zinc-100">{t.issue_types?.title ?? "—"}</span>
                  {t.suppliers?.title && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{t.suppliers.title}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{t.teams?.name ?? "—"}</td>
                <td className="px-6 py-4 space-x-1">
                  {t.escalation_status && (
                    <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                      Escalated
                    </span>
                  )}
                  {t.service_request_status && (
                    <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      Service Req
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{formatDate(t.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
