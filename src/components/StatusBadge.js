import { STATUS_STYLES, STATUS_LABELS } from "@/lib/constants/tickets";

export default function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] ?? status;
  const lines = label.split("\n");

  return (
    <span className={`inline-flex flex-col items-center rounded-md px-2 py-0.5 text-xs font-medium leading-tight ${STATUS_STYLES[status] ?? STATUS_STYLES.in_progress}`}>
      {lines.map((line, i) => <span key={i}>{line}</span>)}
    </span>
  );
}
