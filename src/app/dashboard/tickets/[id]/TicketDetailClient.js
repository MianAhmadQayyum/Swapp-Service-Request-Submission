"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveTicket } from "../actions";

export default function TicketDetailClient({
  ticketId,
  status,
  notes,
  canUpdate,
  statusOptions,
}) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [currentNotes, setCurrentNotes] = useState(notes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await saveTicket(ticketId, selectedStatus, currentNotes);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/dashboard/tickets");
  }

  if (!canUpdate) return null;

  return (
    <form
      onSubmit={handleSave}
      className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 space-y-4"
    >
      <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Update ticket</h3>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-zinc-600 dark:text-zinc-400">Status</label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          disabled={loading}
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100"
        >
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Notes</label>
        <textarea
          value={currentNotes}
          onChange={(e) => setCurrentNotes(e.target.value)}
          placeholder="Add notes..."
          rows={4}
          disabled={loading}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
        />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium py-2 px-4 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/tickets")}
          disabled={loading}
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm font-medium py-2 px-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
