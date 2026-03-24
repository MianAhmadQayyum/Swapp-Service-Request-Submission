// Single source of truth for ticket statuses and list filters.
// Add a new status here — TicketTable, TicketFilters, and the detail page all update automatically.

export const STATUS_OPTIONS = [
  { value: "in_progress",          label: "In Progress" },
  { value: "waiting_for_supplier", label: "Awaiting\nSupplier" },
  { value: "waiting_for_customer", label: "Awaiting\nCustomer" },
  { value: "resolved",             label: "Resolved" },
];

// Derived from STATUS_OPTIONS so labels stay in sync automatically.
export const STATUS_LABELS = Object.fromEntries(
  STATUS_OPTIONS.map((s) => [s.value, s.label])
);

// Tailwind badge classes per status. Add an entry here when adding a status.
export const STATUS_STYLES = {
  in_progress:          "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200",
  waiting_for_supplier: "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200",
  waiting_for_customer: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-200",
  resolved:             "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200",
};

export const DEFAULT_STATUS = "in_progress";

// Filter buttons shown on the ticket list page.
export const FILTERS = [
  { value: "",                 label: "All" },
  { value: "open",             label: "Open" },
  { value: "in_progress",      label: "In Progress" },
  { value: "waiting_supplier", label: "Awaiting — Supplier" },
  { value: "waiting_customer", label: "Awaiting — Customer" },
  { value: "resolved",         label: "Resolved" },
  { value: "escalated",        label: "Escalated" },
  { value: "service_request",  label: "Service Requests" },
];

// Maps a filter value to a function that applies the right Supabase query constraint.
// Add a new filter entry here — tickets/page.js picks it up automatically.
export const FILTER_APPLY = {
  open:             (q) => q.in("status", ["in_progress", "waiting_for_supplier", "waiting_for_customer"]),
  in_progress:      (q) => q.eq("status", "in_progress"),
  waiting_supplier: (q) => q.eq("status", "waiting_for_supplier"),
  waiting_customer: (q) => q.eq("status", "waiting_for_customer"),
  resolved:         (q) => q.eq("status", "resolved"),
  escalated:        (q) => q.eq("escalation_status", true),
  service_request:  (q) => q.eq("service_request_status", true),
};

// Helpers for multi-select filters on the tickets page.
// Maps a status filter key to the underlying ticket.status values it represents.
export const STATUS_FILTER_STATUS_VALUES = {
  open:             ["in_progress", "waiting_for_supplier", "waiting_for_customer"],
  in_progress:      ["in_progress"],
  waiting_supplier: ["waiting_for_supplier"],
  waiting_customer: ["waiting_for_customer"],
  resolved:         ["resolved"],
};

// Tag filters that correspond to boolean columns on tickets.
export const TAG_FILTER_FIELDS = {
  escalated:       { field: "escalation_status", value: true },
  service_request: { field: "service_request_status", value: true },
};
