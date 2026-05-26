import type { ClosetItem } from "@/lib/types";

// Quick stats shown when filters are inactive. Hidden when filtering to
// reduce noise (the count line takes over).
export default function ClosetSummary({ items }: { items: ClosetItem[] }) {
  if (items.length === 0) return null;

  const total = items.length;
  const withPrice = items.filter(i => i.purchase_price != null);
  const totalSpent = withPrice.reduce((sum, i) => sum + Number(i.purchase_price), 0);
  const totalWears = items.reduce((sum, i) => sum + (i.wear_count ?? 0), 0);

  // Cost-per-wear across the closet — sum of costs / sum of wears.
  // Falls back to per-item average when wears are zero.
  const cpw = totalWears > 0 && totalSpent > 0
    ? totalSpent / totalWears
    : null;

  const neverWorn = items.filter(i => i.status === "new").length;
  const neverWornPct = total > 0 ? Math.round((neverWorn / total) * 100) : 0;

  return (
    <div className="card p-3 grid grid-cols-3 divide-x divide-border text-center">
      <Stat label="Items" value={total.toString()} />
      <Stat
        label="Cost / wear"
        value={cpw != null ? `$${cpw.toFixed(2)}` : "—"}
        sub={totalSpent > 0 ? `$${totalSpent.toFixed(0)} total` : undefined}
      />
      <Stat
        label="Never worn"
        value={`${neverWornPct}%`}
        sub={`${neverWorn} item${neverWorn === 1 ? "" : "s"}`}
        tone={neverWornPct > 30 ? "warn" : neverWornPct > 0 ? "default" : "success"}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "warn" | "success";
}) {
  const colorClass =
    tone === "warn" ? "text-warn" :
    tone === "success" ? "text-success" :
    "text-foreground";
  return (
    <div className="px-1">
      <p className={`text-lg font-semibold ${colorClass}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      {sub && <p className="text-[10px] text-muted">{sub}</p>}
    </div>
  );
}
