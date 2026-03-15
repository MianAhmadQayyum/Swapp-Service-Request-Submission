"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createIssueType, deleteIssueType } from "./actions";

export default function AdminIssueTypes({ issueTypes, canEdit }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim() || !canEdit) return;
    setError("");
    setLoading(true);
    const formData = new FormData();
    formData.set("name", name.trim());
    const result = await createIssueType(formData);
    setLoading(false);
    if (result.error) setError(result.error);
    else {
      setName("");
      router.refresh();
    }
  }

  async function handleDelete(id) {
    if (!canEdit) return;
    setError("");
    const result = await deleteIssueType(id);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden">
      {canEdit && (
        <form onSubmit={handleCreate} className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Issue type name"
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium py-2 px-4 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
          >
            Add
          </button>
        </form>
      )}
      {error && <p className="px-4 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
        {issueTypes.map((t) => (
          <li key={t.id} className="px-6 py-3 flex items-center justify-between">
            <span className="text-zinc-900 dark:text-zinc-50">{t.name}</span>
            {canEdit && (
              <button
                type="button"
                onClick={() => handleDelete(t.id)}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
