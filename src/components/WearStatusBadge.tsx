import type { WearStatus } from "@/lib/types";

const styles: Record<WearStatus, { label: string; bg: string; fg: string }> = {
  new: { label: "Never worn", bg: "bg-warn/10", fg: "text-warn" },
  light: { label: "Worn a few", bg: "bg-background", fg: "text-foreground" },
  frequent: { label: "Worn often", bg: "bg-success/10", fg: "text-success" },
  heavy: { label: "Worn a lot", bg: "bg-muted/15", fg: "text-muted" },
};

export default function WearStatusBadge({
  status,
  count,
}: {
  status: WearStatus;
  count?: number;
}) {
  const s = styles[status];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-border ${s.bg} ${s.fg}`}
    >
      {s.label}
      {typeof count === "number" && count > 0 && <span>· {count}</span>}
    </span>
  );
}
