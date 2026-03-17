"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "../actions";
import { canViewDashboard } from "@/lib/constants/roles";

export default function NewTicketForm({ suppliers, issueTypes, csAgents, teams, role }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [serviceRequest, setServiceRequest] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createTicket(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(
      canViewDashboard(role) && result.ticketId
        ? `/dashboard/tickets/${result.ticketId}`
        : "/dashboard/tickets"
    );
    router.refresh();
  }

  const inputCls =
    "w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";
  const labelCls =
    "block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6"
    >
      {/* Row 1: Booking ID + Supplier */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="booking_id" className={labelCls}>
            Booking ID *
          </label>
          <input
            id="booking_id"
            name="booking_id"
            type="text"
            required
            placeholder="e.g. BKG-12345"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="supplier_id" className={labelCls}>
            Supplier *
          </label>
          <select id="supplier_id" name="supplier_id" required className={inputCls}>
            <option value="">Select supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: CS Agent + Issue Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cs_agent_id" className={labelCls}>
            CS Agent *
          </label>
          <select id="cs_agent_id" name="cs_agent_id" required className={inputCls}>
            <option value="">Select CS agent</option>
            {csAgents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="issue_category_id" className={labelCls}>
            Issue Category *
          </label>
          <select
            id="issue_category_id"
            name="issue_category_id"
            required
            className={inputCls}
          >
            <option value="">Select issue category</option>
            {issueTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Issue Description */}
      <div>
        <label htmlFor="issue_description" className={labelCls}>
          Issue Description *
        </label>
        <textarea
          id="issue_description"
          name="issue_description"
          rows={4}
          required
          placeholder="Describe the issue"
          className={inputCls}
        />
      </div>

      {/* Row 3: Assignee Team + Escalation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="assignee_team_id" className={labelCls}>
            Assign to Team *
          </label>
          <select
            id="assignee_team_id"
            name="assignee_team_id"
            required
            className={inputCls}
          >
            <option value="">Select team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 pt-6">
          <input
            id="escalation_status"
            name="escalation_status"
            type="checkbox"
            value="true"
              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-red-600 focus:ring-red-500"
          />
          <label htmlFor="escalation_status" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Mark as escalated
          </label>
        </div>
      </div>

      {/* Service Request toggle */}
      <div className="flex items-center gap-3">
        <input
          id="service_request_status"
          name="service_request_status"
          type="checkbox"
          value="true"
          onChange={(e) => setServiceRequest(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-emerald-600 focus:ring-emerald-500"
        />
        <label htmlFor="service_request_status" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Service request opened
        </label>
      </div>

      {/* Conditional: car plate + odometer */}
      {serviceRequest && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="car_plate" className={labelCls}>
              Car Number Plate
            </label>
            <input
              id="car_plate"
              name="car_plate"
              type="text"
              placeholder="e.g. ABC 1234"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="odometer" className={labelCls}>
              Odometer Reading
            </label>
            <input
              id="odometer"
              name="odometer"
              type="text"
              placeholder="e.g. 45000 km"
              className={inputCls}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium py-2 px-4 text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create ticket"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium py-2 px-4 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
