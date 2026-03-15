"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfileRole, updateProfileTeam } from "./actions";

const ROLES = [
  { value: "customer_support", label: "Customer Support" },
  { value: "operations", label: "Operations" },
  { value: "operations_manager", label: "Operations Manager" },
  { value: "admin", label: "Admin" },
];

const TEAMS = [
  { value: "", label: "— No team —" },
  { value: "Operations", label: "Operations" },
  { value: "Logistics", label: "Logistics" },
  { value: "Charging Team", label: "Charging Team" },
  { value: "Debt Collection", label: "Debt Collection" },
  { value: "Supply Team", label: "Supply Team" },
  { value: "Damages & FC", label: "Damages & FC" },
];

export default function AdminUsers({ authUsers, profiles, profilesById }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState("");

  async function handleRoleChange(userId, newRole) {
    setError("");
    setUpdating(userId);
    const result = await updateProfileRole(userId, newRole);
    setUpdating(null);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  async function handleTeamChange(userId, newTeam) {
    setError("");
    setUpdating(userId);
    const result = await updateProfileTeam(userId, newTeam || null);
    setUpdating(null);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden">
      {error && (
        <p className="px-6 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20">
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-700/50 text-left text-zinc-600 dark:text-zinc-300">
              <th className="px-6 py-3 font-medium">Email / Name</th>
              <th className="px-6 py-3 font-medium">Role</th>
              <th className="px-6 py-3 font-medium">Team</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {authUsers.map((u) => {
              const profile = profilesById[u.id];
              const currentRole = profile?.role ?? "customer_support";
              const currentTeam = profile?.team ?? "";
              return (
                <tr key={u.id}>
                  <td className="px-6 py-4">
                    <span className="text-zinc-900 dark:text-zinc-50">{u.email}</span>
                    {profile?.full_name && (
                      <span className="text-zinc-500 dark:text-zinc-400 ml-1">
                        ({profile.full_name})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={currentRole}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={updating === u.id}
                      className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 py-1 text-zinc-900 dark:text-zinc-100"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={currentTeam}
                      onChange={(e) => handleTeamChange(u.id, e.target.value)}
                      disabled={updating === u.id || currentRole !== "operations"}
                      className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 py-1 text-zinc-900 dark:text-zinc-100 min-w-[140px]"
                      title={currentRole !== "operations" ? "Team applies to Operations role" : ""}
                    >
                      {TEAMS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    {currentRole === "operations" && !currentTeam && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Set team to see tickets assigned to that team
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
