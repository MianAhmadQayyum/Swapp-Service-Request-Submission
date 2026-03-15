"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "../actions";

const SUPPLIERS = [
  "Thrifty DXB",
  "Dollar DXB",
  "Shift DXB",
  "Legend world Rent A Car (DXB)",
  "Diamondlease",
  "Swapp - Diamondlease",
  "Swapp - Morning Star",
  "Swapp - Avis",
  "Swapp - Paramount",
  "Swapp - Hertz",
  "Swapp - Legend",
  "Swapp - Yaseer",
  "Swapp - Ok Mobility",
  "Thrifty AUH",
  "Dollar AUH",
  "Legend world Rent A Car (AUH)",
  "Automates Auto Rentals LLC",
  "Swapp-Shift",
  "Paramount",
  "Others",
  "Thrifty Al Ain",
];

const ISSUE_CATEGORIES = [
  "Handovers - Features Missing",
  "Handovers - Car Not Available",
  "Handovers - Poor Car Condition",
  "Handovers - Supplier Delay",
  "Handovers - Rude Behaviour",
  "Service Requests & Replacements - Delay",
  "Service Requests & Replacements - Poor Handling(Driver, Care)",
  "Service Requests & Replacements - Faulty Replacement",
  "Service Requests & Replacements - Damage Charges",
  "Payments - Rental Fee",
  "Payments - Damages",
  "Payments - Extra Miles",
  "Payments - Fuel",
  "Payments - Cleaning Charges",
  "Payments - Parking",
  "Payments - Discount Coupon",
  "Payments-Fines",
  "Payments - Saliks",
  "Handbacks - Supplier Delay",
  "Handbacks - Rude Behaviour",
  "KYC & Pre-Booking - Delayed Approval",
  "KYC & Pre-Booking - Booking Rejected",
  "KYC & Pre-Booking - Poor Communication",
  "Care Handling - Incorrect Information",
  "Care Handling - Lack of Empathy",
  "Care Handling - Excessive Interactions",
  "Care Handling - Internal Mistake",
  "Other",
];

const CS_AGENTS = [
  "Rim",
  "Beenish",
  "Malaika",
  "Maryam",
  "Saqlain",
  "Shabbar",
  "Roshaan",
  "Mahnur",
  "Rafia",
  "Tariq",
  "Elio",
  "Anthony",
  "Joe",
  "Joyce",
  "Sara",
];

const YES_NO = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const TEAM_ASSIGNED = [
  "Operations",
  "Logistics",
  "Charging Team",
  "Debt Collection",
  "Supply Team",
  "Damages & FC",
];

export default function NewTicketForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [serviceRequestOpened, setServiceRequestOpened] = useState("");
  const showServiceFields = serviceRequestOpened === "Yes";

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
    router.push(result.ticketId ? `/dashboard/tickets/${result.ticketId}` : "/dashboard/tickets");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="booking_id" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Booking ID *
          </label>
          <input
            id="booking_id"
            name="booking_id"
            type="text"
            required
            placeholder="Short answer"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label htmlFor="supplier" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Supplier *
          </label>
          <select
            id="supplier"
            name="supplier"
            required
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Select supplier</option>
            {SUPPLIERS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cs_agent" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            CS Agent *
          </label>
          <select
            id="cs_agent"
            name="cs_agent"
            required
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Select CS agent</option>
            {CS_AGENTS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="issue_category" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Issue Category *
          </label>
          <select
            id="issue_category"
            name="issue_category"
            required
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Select issue category</option>
            {ISSUE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Issue Description *
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          placeholder="Short answer"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="escalation_status" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Escalation Status *
          </label>
          <select
            id="escalation_status"
            name="escalation_status"
            required
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Select</option>
            {YES_NO.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="service_request_opened" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Service Request Opened (Yes/No) *
          </label>
          <select
            id="service_request_opened"
            name="service_request_opened"
            required
            value={serviceRequestOpened}
            onChange={(e) => setServiceRequestOpened(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Select</option>
            {YES_NO.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      {showServiceFields && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="number_plate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Car Number Plate
            </label>
            <input
              id="number_plate"
              name="number_plate"
              type="text"
              placeholder="e.g. ABC 1234"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="odometer_reading" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Odometer reading (in case of service due)
            </label>
            <input
              id="odometer_reading"
              name="odometer_reading"
              type="text"
              placeholder="e.g. 45000 km"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      )}
      <div>
        <label htmlFor="team_assigned" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Team Assigned
        </label>
        <select
          id="team_assigned"
          name="team_assigned"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Select team</option>
          {TEAM_ASSIGNED.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
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
