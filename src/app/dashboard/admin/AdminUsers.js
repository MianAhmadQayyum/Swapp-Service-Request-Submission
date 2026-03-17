"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfileRole, updateProfileTeam, revokeUserAccess, restoreUserAccess } from "./actions";
import { ROLES, DEFAULT_ROLE, isTeamMember } from "@/lib/constants/roles";

export default function AdminUsers({ profiles, teams }) {
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

  async function handleTeamChange(userId, newTeamId) {
    setError("");
    setUpdating(userId);
    const result = await updateProfileTeam(userId, newTeamId || null);
    setUpdating(null);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  async function handleRevoke(userId, disabled) {
    setError("");
    setUpdating(userId);
    const result = await (disabled ? restoreUserAccess(userId) : revokeUserAccess(userId));
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
              <th className="px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td className="px-6 py-4">
                  <span className="text-zinc-900 dark:text-zinc-50">{profile.email}</span>
                  {profile.name && (
                    <span className="text-zinc-500 dark:text-zinc-400 ml-1">
                      ({profile.name})
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <select
                    value={profile.role ?? DEFAULT_ROLE}
                    onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                    disabled={updating === profile.id}
                    className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 py-1 text-zinc-900 dark:text-zinc-100"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={profile.team_id ?? ""}
                    onChange={(e) => handleTeamChange(profile.id, e.target.value)}
                    disabled={updating === profile.id || !isTeamMember(profile.role)}
                    className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 py-1 text-zinc-900 dark:text-zinc-100 min-w-[140px]"
                  >
                    <option value="">— No team —</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {isTeamMember(profile.role) && !profile.team_id && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Assign a team so this user can see tickets
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleRevoke(profile.id, profile.disabled)}
                    disabled={updating === profile.id}
                    className={`rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                      profile.disabled
                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60"
                        : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60"
                    }`}
                  >
                    {profile.disabled ? "Restore" : "Revoke"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
