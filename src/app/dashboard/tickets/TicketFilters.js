"use client";

import { useRouter, useSearchParams } from "next/navigation";

const FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "assigned_to_me", label: "Assigned to me" },
  { value: "sla_breaching", label: "SLA breaching soon" },
  { value: "high_priority", label: "High priority" },
];

export default function TicketFilters({ currentFilter, supplierId, suppliers }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(filter) {
    const p = new URLSearchParams(searchParams?.toString() || "");
    if (filter) p.set("filter", filter);
    else p.delete("filter");
    router.push(`/dashboard/tickets?${p.toString()}`);
  }

  function setSupplier(id) {
    const p = new URLSearchParams(searchParams?.toString() || "");
    if (id) p.set("supplier", id);
    else p.delete("supplier");
    router.push(`/dashboard/tickets?${p.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              currentFilter === f.value
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {suppliers.length > 0 && (
        <select
          value={supplierId || ""}
          onChange={(e) => setSupplier(e.target.value)}
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm px-3 py-1.5"
        >
          <option value="">All suppliers</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
