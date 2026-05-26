"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface OutfitRow {
  id: string;
  name: string | null;
  worn_at: string;
  photo_path: string | null;
  occasion: string | null;
  outfit_items: { item_id: string; closet_items: { name: string; photo_path: string | null } | null }[];
}

// Month-grid calendar of outfit logs.
// Receives monthKey as 'YYYY-MM' (no Date round-trip → no TZ shift bug).
export default function OutfitCalendar({
  monthKey,
  outfits,
}: {
  monthKey: string;
  outfits: OutfitRow[];
}) {
  const router = useRouter();
  const [yearStr, monStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monStr) - 1; // 0-based
  const today = new Date();
  const todayKey = ymdKey(today);

  // Index outfits by YYYY-MM-DD for fast lookup
  const byDay = new Map<string, OutfitRow[]>();
  for (const o of outfits) {
    const key = ymdKey(new Date(o.worn_at));
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(o);
  }

  const [selected, setSelected] = useState<string | null>(todayKey);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOffset = new Date(year, month, 1).getDay(); // Sun=0
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);

  function navMonth(delta: number) {
    // Pure integer math — no Date object, no TZ to worry about.
    let m = month + delta;
    let y = year;
    while (m < 0) { m += 12; y -= 1; }
    while (m > 11) { m -= 12; y += 1; }
    const monthParam = `${y}-${String(m + 1).padStart(2, "0")}`;
    router.push(`/outfits?view=calendar&month=${monthParam}`);
  }

  const selectedOutfits = selected ? byDay.get(selected) ?? [] : [];

  return (
    <div className="space-y-4">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navMonth(-1)}
          aria-label="Previous month"
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-card"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="font-medium">
          {new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h2>
        <button
          onClick={() => navMonth(1)}
          aria-label="Next month"
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-card"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-muted">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d}>{d}</div>)}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayOutfits = byDay.get(key) ?? [];
          const isToday = key === todayKey;
          const isSelected = key === selected;
          const has = dayOutfits.length > 0;
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative
                ${isSelected ? "bg-accent text-background" : has ? "bg-success/10 text-foreground" : "bg-card"}
                ${isToday && !isSelected ? "ring-1 ring-accent" : ""}
              `}
            >
              <span className={isToday ? "font-semibold" : ""}>{day}</span>
              {has && !isSelected && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-success" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day's outfits */}
      {selected && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {new Date(`${selected}T00:00:00`).toLocaleDateString(undefined, {
                weekday: "long", month: "long", day: "numeric",
              })}
            </h3>
            {selectedOutfits.length === 0 && selected <= todayKey && (
              <Link
                href="/outfits/new"
                className="text-xs inline-flex items-center gap-1 text-muted hover:text-foreground"
              >
                <Plus size={12} /> Log
              </Link>
            )}
          </div>

          {selectedOutfits.length === 0 ? (
            <p className="text-xs text-muted">
              {selected > todayKey ? "Future date." : "No outfit logged this day."}
            </p>
          ) : (
            <ul className="space-y-2">
              {selectedOutfits.map(o => (
                <li key={o.id}>
                  <Link href={`/outfits/${o.id}`} className="card p-3 flex gap-3 items-center">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm">{o.name || "Outfit"}</div>
                      <div className="text-xs text-muted">
                        {o.occasion || "—"}
                        {o.outfit_items.length > 0 && ` · ${o.outfit_items.length} items`}
                      </div>
                    </div>
                    <ItemStack items={o.outfit_items} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ItemStack({ items }: { items: OutfitRow["outfit_items"] }) {
  return (
    <div className="flex -space-x-2">
      {items.slice(0, 3).map((oi, i) => {
        const p = oi.closet_items?.photo_path;
        return (
          <div key={i} className="w-10 h-10 rounded-full border-2 border-card overflow-hidden bg-background flex items-center justify-center text-base">
            {p ? <Thumb path={p} /> : "👕"}
          </div>
        );
      })}
    </div>
  );
}

function Thumb({ path }: { path: string }) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const url = `${base}/storage/v1/object/public/item-photos/${path}?width=80&height=80&resize=cover&quality=70`;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="w-full h-full object-cover" />;
}

function ymdKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
