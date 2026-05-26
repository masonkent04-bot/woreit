"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Plus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ClosetItem } from "@/lib/types";

interface TripOutfit {
  id: string;
  day_number: number;
  slot: "day" | "evening" | "workout" | "other";
  name: string | null;
  occasion: string | null;
  notes: string | null;
  trip_outfit_items: { item_id: string; closet_items: ClosetItem | null }[];
}

const SLOTS: TripOutfit["slot"][] = ["day", "evening", "workout", "other"];

export default function TripDayPlanner({
  tripId,
  dayCount,
  outfits,
  items,
  isOwner,
}: {
  tripId: string;
  dayCount: number;
  outfits: TripOutfit[];
  items: ClosetItem[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [pending, start] = useTransition();
  const [picker, setPicker] = useState<{ day: number; slot: TripOutfit["slot"] } | null>(null);
  const [pickerSelection, setPickerSelection] = useState<Set<string>>(new Set());
  const [pickerName, setPickerName] = useState("");

  // Group outfits by day
  const byDay = new Map<number, TripOutfit[]>();
  for (const o of outfits) {
    if (!byDay.has(o.day_number)) byDay.set(o.day_number, []);
    byDay.get(o.day_number)!.push(o);
  }

  async function createOutfit() {
    if (!picker || pickerSelection.size === 0) return;
    start(async () => {
      const { data: outfit } = await supabase
        .from("trip_outfits")
        .insert({
          trip_id: tripId,
          day_number: picker.day,
          slot: picker.slot,
          name: pickerName.trim() || null,
        })
        .select()
        .single();
      if (outfit) {
        await supabase.from("trip_outfit_items").insert(
          Array.from(pickerSelection).map(item_id => ({ trip_outfit_id: outfit.id, item_id }))
        );
        setPicker(null);
        setPickerSelection(new Set());
        setPickerName("");
        router.refresh();
      }
    });
  }

  async function deleteOutfit(id: string) {
    start(async () => {
      await supabase.from("trip_outfits").delete().eq("id", id);
      router.refresh();
    });
  }

  function togglePickerItem(id: string) {
    const next = new Set(pickerSelection);
    next.has(id) ? next.delete(id) : next.add(id);
    setPickerSelection(next);
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: dayCount }, (_, i) => i + 1).map(day => {
        const dayOutfits = byDay.get(day) ?? [];
        return (
          <div key={day} className="card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Day {day}</h3>
              {isOwner && (
                <button
                  onClick={() => { setPicker({ day, slot: "day" }); setPickerSelection(new Set()); }}
                  className="text-xs text-muted underline flex items-center gap-1"
                >
                  <Plus size={11} /> Add outfit
                </button>
              )}
            </div>

            {dayOutfits.length === 0 ? (
              <p className="text-xs text-muted">No outfit planned.</p>
            ) : (
              <div className="space-y-2">
                {dayOutfits.map(o => (
                  <div key={o.id} className="border border-border rounded-2xl p-2 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium capitalize">
                          {o.slot}{o.name ? ` · ${o.name}` : ""}
                        </p>
                        {o.occasion && <p className="text-[10px] text-muted">{o.occasion}</p>}
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => deleteOutfit(o.id)}
                          disabled={pending}
                          aria-label="Delete outfit"
                          className="w-6 h-6 rounded-full hover:bg-card flex items-center justify-center text-muted"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    <div className="flex gap-1 overflow-x-auto no-scrollbar">
                      {o.trip_outfit_items.map(oi => {
                        const it = oi.closet_items;
                        if (!it) return null;
                        const url = it.photo_path
                          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-photos/${it.photo_path}?width=160&height=160&resize=cover&quality=70`
                          : null;
                        return (
                          <Link key={oi.item_id} href={`/closet/${it.id}`} className="shrink-0">
                            <div className="w-14 h-14 rounded-xl overflow-hidden border border-border bg-background relative">
                              {url ? (
                                <Image src={url} alt={it.name} fill sizes="56px" className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg">👕</div>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Item picker modal */}
      {picker && (
        <div className="fixed inset-0 bg-foreground/30 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-background rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-medium">Day {picker.day} — pick items</h3>
                <p className="text-xs text-muted">{pickerSelection.size} selected</p>
              </div>
              <button onClick={() => setPicker(null)} aria-label="Close"
                className="w-9 h-9 rounded-full hover:bg-card flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3 border-b border-border">
              <input
                value={pickerName}
                onChange={(e) => setPickerName(e.target.value)}
                placeholder="Outfit name (optional)"
                className="w-full h-10 px-3 rounded-full border border-border bg-background text-sm"
              />
              <div className="flex gap-1">
                {SLOTS.map(s => (
                  <button key={s} onClick={() => setPicker({ ...picker, slot: s })}
                    className={`flex-1 h-9 rounded-full text-xs capitalize border ${
                      picker.slot === s ? "bg-accent text-background border-accent" : "border-border bg-card"
                    }`}>{s}</button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-3 gap-2">
                {items.map(it => {
                  const url = it.photo_path
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-photos/${it.photo_path}?width=200&height=200&resize=cover&quality=70`
                    : null;
                  const selected = pickerSelection.has(it.id);
                  return (
                    <button key={it.id} onClick={() => togglePickerItem(it.id)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 ${
                        selected ? "border-accent" : "border-transparent"
                      }`}>
                      {url ? (
                        <Image src={url} alt={it.name} fill sizes="33vw" className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl bg-card">👕</div>
                      )}
                      <p className="absolute bottom-0 inset-x-0 text-[10px] bg-background/80 px-1 truncate text-center py-0.5">
                        {it.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-border">
              <button
                onClick={createOutfit}
                disabled={pending || pickerSelection.size === 0}
                className="w-full h-11 rounded-full bg-accent text-background font-medium disabled:opacity-40"
              >
                {pending ? "Adding…" : `Add ${pickerSelection.size} item${pickerSelection.size === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
