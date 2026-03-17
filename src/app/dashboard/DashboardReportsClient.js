function StatCard({ label, value, subtitle, color }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${color ?? "text-zinc-900 dark:text-zinc-50"}`}>
        {value ?? "—"}
      </p>
      {subtitle && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

function BreakdownList({ title, data }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
      <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">{title}</h4>
      {entries.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No data.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map(([name, count]) => (
            <li key={name} className="flex justify-between text-sm">
              <span className="text-zinc-900 dark:text-zinc-50">{name}</span>
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function pct(numerator, denominator) {
  if (!denominator) return null;
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export default function DashboardReportsClient({
  total,
  open,
  resolved,
  inProgress,
  waitingSupplier,
  waitingCustomer,
  ticketsWithSla,
  withinSla,
  breachedSla,
  breachedUnresolved,
  avgResolutionHours,
  bySupplier,
  byIssueType,
}) {
  const withinSlaPct   = pct(withinSla, ticketsWithSla);
  const breachedSlaPct = pct(breachedSla, ticketsWithSla);

  return (
    <div className="space-y-6">
      {/* Row 1: high-level counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Tickets" value={total} />
        <StatCard label="Open" value={open} color="text-amber-600 dark:text-amber-400" />
        <StatCard label="Resolved" value={resolved} color="text-emerald-600 dark:text-emerald-400" />
        <StatCard
          label="Avg Resolution Time"
          value={avgResolutionHours != null ? `${avgResolutionHours}h` : null}
        />
      </div>

      {/* Row 2: status breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="In Progress" value={inProgress} color="text-amber-600 dark:text-amber-400" />
        <StatCard label="Awaiting — Supplier" value={waitingSupplier} color="text-purple-600 dark:text-purple-400" />
        <StatCard label="Awaiting — Customer" value={waitingCustomer} color="text-cyan-600 dark:text-cyan-400" />
      </div>

      {/* Row 3: SLA */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          label="Resolved Within SLA"
          value={withinSlaPct}
          subtitle={ticketsWithSla ? `${withinSla} of ${ticketsWithSla} with SLA` : "No SLA tickets"}
          color="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Breached SLA"
          value={breachedSlaPct}
          subtitle={ticketsWithSla ? `${breachedSla} of ${ticketsWithSla} with SLA` : "No SLA tickets"}
          color="text-red-600 dark:text-red-400"
        />
        <StatCard
          label="Breached SLA — Still Open"
          value={breachedUnresolved || "0"}
          subtitle="unresolved past deadline"
          color={breachedUnresolved > 0 ? "text-red-600 dark:text-red-400" : undefined}
        />
      </div>

      {/* Row 4: breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BreakdownList title="Tickets by Supplier" data={bySupplier} />
        <BreakdownList title="Tickets by Issue Type" data={byIssueType} />
      </div>
    </div>
  );
}
