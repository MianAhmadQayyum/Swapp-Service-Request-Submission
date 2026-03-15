"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSlaRule, deleteSlaRule } from "./actions";

export default function AdminSlaRules({ slaRules, issueTypes, canEdit }) {
  const router = useRouter();
  const [issueTypeId, setIssueTypeId] = useState("");
  const [hours, setHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    if (!canEdit || !issueTypeId || !hours) return;
    setError("");
    setLoading(true);
    const formData = new FormData();
    formData.set("issue_type_id", issueTypeId);
    formData.set("resolution_hours", hours);
    const result = await createSlaRule(formData);
    setLoading(false);
    if (result.error) setError(result.error);
    else {
      setIssueTypeId("");
      setHours("");
      router.refresh();
    }
  }

  async function handleDelete(id) {
    if (!canEdit) return;
    setError("");
    const result = await deleteSlaRule(id);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden">
      {canEdit && (
        <form onSubmit={handleCreate} className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Issue type</label>
            <select
              value={issueTypeId}
              onChange={(e) => setIssueTypeId(e.target.value)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
            >
              <option value="">Select</option>
              {issueTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Hours</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="2"
              className="w-20 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium py-2 px-4 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
          >
            Add rule
          </button>
        </form>
      )}
      {error && <p className="px-4 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-700/50 text-left text-zinc-600 dark:text-zinc-300">
              <th className="px-6 py-3 font-medium">Issue type</th>
              <th className="px-6 py-3 font-medium">Resolution (hours)</th>
              {canEdit && <th className="px-6 py-3 font-medium"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {slaRules.map((r) => (
              <tr key={r.id}>
                <td className="px-6 py-4 text-zinc-900 dark:text-zinc-50">
                  {r.issue_types?.name ?? "—"}
                </td>
                <td className="px-6 py-4 text-zinc-900 dark:text-zinc-50">{r.resolution_hours}</td>
                {canEdit && (
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="text-red-600 dark:text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
