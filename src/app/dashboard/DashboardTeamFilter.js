"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function DashboardTeamFilter({ teams, currentTeamId }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setTeam(id) {
    const p = new URLSearchParams(searchParams?.toString() || "");
    if (id) p.set("team", id);
    else p.delete("team");
    router.push(`/dashboard?${p.toString()}`);
  }

  return (
    <select
      value={currentTeamId || ""}
      onChange={(e) => setTeam(e.target.value)}
      className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm px-3 py-1.5"
    >
      <option value="">All teams</option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>{t.name}</option>
      ))}
    </select>
  );
}
