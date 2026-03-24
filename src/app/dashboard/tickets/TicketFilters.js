"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FILTERS } from "@/lib/constants/tickets";

export default function TicketFilters({ currentFilter, supplierId, suppliers, teamId, teams }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key, value) {
    const p = new URLSearchParams(searchParams?.toString() || "");
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete("page");
    router.push(`/dashboard/tickets?${p.toString()}`);
  }

  const statusFiltersParam = searchParams?.get("status_filters") || "";
  const tagFiltersParam = searchParams?.get("tag_filters") || "";

  const statusFilterKeys = new Set(
    statusFiltersParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

  const tagFilterKeys = new Set(
    tagFiltersParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

  function toggleFilter(value) {
    const p = new URLSearchParams(searchParams?.toString() || "");

    // Clearing \"All\" resets all status/tag filters and legacy filter.
    if (!value) {
      p.delete("status_filters");
      p.delete("tag_filters");
      p.delete("filter");
      p.delete("page");
      router.push(`/dashboard/tickets?${p.toString()}`);
      return;
    }

    const isTag = value === "escalated" || value === "service_request";

    const key = isTag ? "tag_filters" : "status_filters";
    const current = (p.get(key) || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const set = new Set(current);
    if (set.has(value)) set.delete(value);
    else set.add(value);

    if (set.size === 0) p.delete(key);
    else p.set(key, Array.from(set).join(","));

    // Clear legacy single filter and page when using multi-select buttons.
    p.delete("filter");
    p.delete("page");

    router.push(`/dashboard/tickets?${p.toString()}`);
  }

  function isActive(value) {
    if (!value) {
      return statusFilterKeys.size === 0 && tagFilterKeys.size === 0;
    }
    if (value === "escalated" || value === "service_request") {
      return tagFilterKeys.has(value);
    }
    return statusFilterKeys.has(value);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            type="button"
            onClick={() => toggleFilter(f.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive(f.value)
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
          onChange={(e) => setParam("supplier", e.target.value)}
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm px-3 py-1.5"
        >
          <option value="">All suppliers</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      )}
      {teams?.length > 0 && (
        <select
          value={teamId || ""}
          onChange={(e) => setParam("team", e.target.value)}
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm px-3 py-1.5"
        >
          <option value="">All teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}
