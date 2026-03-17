"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createIssueType, updateIssueTypeSla, deleteIssueType } from "./actions";

export default function AdminIssueTypes({ issueTypes }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slaHours, setSlaHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setError("");
    setLoading(true);
    const formData = new FormData();
    formData.set("title", title.trim());
    if (slaHours.trim()) formData.set("sla_hours", slaHours.trim());
    const result = await createIssueType(formData);
    setLoading(false);
    if (result.error) setError(result.error);
    else {
      setTitle("");
      setSlaHours("");
      router.refresh();
    }
  }

  async function handleSlaUpdate(id, value) {
    const result = await updateIssueTypeSla(id, value || null);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  async function handleDelete(id) {
    setError("");
    const result = await deleteIssueType(id);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden">
      <form
        onSubmit={handleCreate}
        className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex gap-2 flex-wrap"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Issue type title"
          required
          className="flex-1 min-w-[160px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
        />
        <input
          value={slaHours}
          onChange={(e) => setSlaHours(e.target.value)}
          placeholder="SLA hours (optional)"
          type="number"
          min="0.1"
          step="0.1"
          className="w-40 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium py-2 px-4 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
        >
          Add
        </button>
      </form>
      {error && <p className="px-4 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-700/50 text-left text-zinc-600 dark:text-zinc-300">
            <th className="px-6 py-3 font-medium">Title</th>
            <th className="px-6 py-3 font-medium">SLA (hours)</th>
            <th className="px-6 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {issueTypes.map((t) => (
            <IssueTypeRow
              key={t.id}
              issueType={t}
              onSlaUpdate={handleSlaUpdate}
              onDelete={handleDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IssueTypeRow({ issueType, onSlaUpdate, onDelete }) {
  const [sla, setSla] = useState(issueType.sla_resolution_hours_limit?.toString() ?? "");

  function handleBlur() {
    const newVal = sla.trim() || null;
    const current = issueType.sla_resolution_hours_limit?.toString() ?? "";
    if (newVal !== (current || null)) {
      onSlaUpdate(issueType.id, newVal);
    }
  }

  return (
    <tr>
      <td className="px-6 py-3 text-zinc-900 dark:text-zinc-50">{issueType.title}</td>
      <td className="px-6 py-3">
        <input
          type="number"
          min="0.1"
          step="0.1"
          value={sla}
          onChange={(e) => setSla(e.target.value)}
          onBlur={handleBlur}
          placeholder="No SLA"
          className="w-28 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100"
        />
      </td>
      <td className="px-6 py-3 text-right">
        <button
          type="button"
          onClick={() => onDelete(issueType.id)}
          className="text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
