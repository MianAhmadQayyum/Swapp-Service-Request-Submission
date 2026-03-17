/**
 * Formats a date string or Date object for display in the UI.
 * Returns "—" for null/undefined values.
 */
export function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}
