"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateTicketStatus,
  assignTicket,
  addTicketUpdate,
  markSlaBreached,
} from "../actions";

export default function TicketDetailClient({
  ticketId,
  status,
  canUpdate,
  statuses,
  updates,
  assigneeId,
  assigneeName,
  profilesList,
  role,
}) {
  const router = useRouter();
  const [statusLoading, setStatusLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function handleStatusChange(newStatus) {
    setError("");
    setStatusLoading(true);
    const result = await updateTicketStatus(ticketId, newStatus);
    setStatusLoading(false);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  async function handleAssign(assignToId) {
    setError("");
    setAssignLoading(true);
    const result = await assignTicket(ticketId, assignToId || null);
    setAssignLoading(false);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!note.trim()) return;
    setError("");
    setNoteLoading(true);
    const result = await addTicketUpdate(ticketId, note);
    setNoteLoading(false);
    if (result.error) setError(result.error);
    else {
      setNote("");
      router.refresh();
    }
  }

  async function handleMarkSlaBreached() {
    setError("");
    const result = await markSlaBreached(ticketId);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="space-y-6">
      {canUpdate && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 space-y-4">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Update ticket</h3>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Status</label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={statusLoading}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            {(role === "admin" || role === "operations_manager") && (
              <>
                <label className="text-sm text-zinc-600 dark:text-zinc-400 ml-2">Assign to</label>
                <select
                  value={assigneeId || ""}
                  onChange={(e) => handleAssign(e.target.value || null)}
                  disabled={assignLoading}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100"
                >
                  <option value="">Unassigned</option>
                  {profilesList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name ?? p.id} ({p.role})
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
          {["operations", "operations_manager", "admin"].includes(role) && (
            <button
              type="button"
              onClick={handleMarkSlaBreached}
              className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
            >
              Mark SLA breached
            </button>
          )}
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-50 mb-4">Internal notes</h3>
        {canUpdate && (
          <form onSubmit={handleAddNote} className="mb-4">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              rows={2}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
            />
            <button
              type="submit"
              disabled={noteLoading || !note.trim()}
              className="mt-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium py-1.5 px-3 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
            >
              {noteLoading ? "Adding…" : "Add note"}
            </button>
          </form>
        )}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
        )}
        <ul className="space-y-3">
          {updates.length === 0 ? (
            <li className="text-sm text-zinc-500 dark:text-zinc-400">No notes yet.</li>
          ) : (
            updates.map((u) => (
              <li
                key={u.id}
                className="text-sm border-l-2 border-zinc-200 dark:border-zinc-600 pl-3 py-1"
              >
                <p className="text-zinc-900 dark:text-zinc-50 whitespace-pre-wrap">{u.comment}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {new Date(u.created_at).toLocaleString()}
                </p>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
