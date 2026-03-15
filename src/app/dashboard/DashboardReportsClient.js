export default function DashboardReportsClient({
  totalTickets,
  openTickets,
  resolvedTickets,
  withinSlaCount,
  breachedCount,
  avgResolutionHours,
  byIssueType,
  bySupplier,
}) {
  const slaRate =
    resolvedTickets > 0
      ? Math.round((withinSlaCount / resolvedTickets) * 100)
      : null;

  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-md font-medium text-zinc-900 dark:text-zinc-50">
        Operations reporting
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Resolved within SLA</p>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {withinSlaCount} / {resolvedTickets}
          </p>
          {slaRate !== null && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{slaRate}% compliance</p>
          )}
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">SLA breached</p>
          <p className="text-xl font-semibold text-red-600 dark:text-red-400">{breachedCount}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Avg resolution time</p>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {avgResolutionHours != null ? `${avgResolutionHours}h` : "—"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            Tickets by issue type
          </h4>
          <ul className="space-y-2">
            {Object.entries(byIssueType)
              .sort((a, b) => b[1] - a[1])
              .map(([name, count]) => (
                <li key={name} className="flex justify-between text-sm">
                  <span className="text-zinc-900 dark:text-zinc-50">{name}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">{count}</span>
                </li>
              ))}
          </ul>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            Tickets by supplier
          </h4>
          <ul className="space-y-2">
            {Object.entries(bySupplier)
              .sort((a, b) => b[1] - a[1])
              .map(([name, count]) => (
                <li key={name} className="flex justify-between text-sm">
                  <span className="text-zinc-900 dark:text-zinc-50">{name}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">{count}</span>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
