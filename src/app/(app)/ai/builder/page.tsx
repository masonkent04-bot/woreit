"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ClosetItem } from "@/lib/types";
import { OCCASION_TAGS } from "@/lib/types";

export default function OutfitBuilderPage() {
  const supabase = createClient();
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [occasion, setOccasion] = useState<string>("casual");
  const [suggestion, setSuggestion] = useState<ClosetItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("closet_items")
        .select("*")
        .eq("owner_id", user.id)
        .eq("is_archived", false)
        .eq("is_laundry", false);
      setItems((data as ClosetItem[]) ?? []);
    })();
  }, [supabase]);

  function build() {
    setLoading(true);
    // Smart-pick algorithm: one top + one bottom OR one dress, then shoes + optional outerwear
    // Prefers items matching the occasion + underworn items for variety
    const pool = items.filter(i =>
      i.occasion_tags.length === 0 || i.occasion_tags.includes(occasion)
    );
    const score = (it: ClosetItem) => {
      let s = Math.random();
      if (it.status === "new") s += 0.6;
      if (it.status === "light") s += 0.3;
      if (it.occasion_tags.includes(occasion)) s += 0.5;
      if (it.rating && it.rating >= 4) s += 0.2;
      return s;
    };
    const sorted = [...pool].sort((a, b) => score(b) - score(a));
    const pick = (cats: string[]) => sorted.find(i => cats.includes(i.category));

    const dress = pick(["dress"]);
    const out: ClosetItem[] = [];
    if (dress && Math.random() > 0.5) {
      out.push(dress);
    } else {
      const top = pick(["top"]);
      const bottom = pick(["bottom", "skirt"]);
      if (top) out.push(top);
      if (bottom && bottom.id !== top?.id) out.push(bottom);
    }
    const shoes = pick(["shoes"]);
    if (shoes) out.push(shoes);
    const outer = pick(["outerwear"]);
    if (outer && Math.random() > 0.4) out.push(outer);
    const acc = pick(["accessory", "jewelry", "bag"]);
    if (acc) out.push(acc);

    setSuggestion(out);
    setTimeout(() => setLoading(false), 250);
  }

  async function logIt() {
    if (!userId || !suggestion) return;
    const { data: prof } = await supabase.from("profiles").select("family_id").eq("id", userId).single();
    const { data: outfit } = await supabase
      .from("outfits")
      .insert({
        owner_id: userId,
        family_id: prof?.family_id ?? null,
        name: `AI ${occasion} look`,
        occasion,
        ai_generated: true,
      })
      .select().single();
    if (outfit) {
      await supabase.from("outfit_items").insert(
        suggestion.map(it => ({ outfit_id: outfit.id, item_id: it.id }))
      );
      window.location.href = `/outfits/${outfit.id}`;
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Sparkles size={22} /> AI outfit builder
        </h1>
        <p className="text-sm text-muted mt-1">Builds an outfit from what you own, favoring underworn items.</p>
      </header>

      <div className="card p-4 space-y-3">
        <label className="text-xs uppercase tracking-wide text-muted">Occasion</label>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {OCCASION_TAGS.map(o => (
            <button key={o} onClick={() => setOccasion(o)}
              className={`shrink-0 h-9 px-4 rounded-full text-sm capitalize border ${occasion === o ? "bg-accent text-background border-accent" : "border-border bg-background"}`}
            >{o}</button>
          ))}
        </div>
        <button
          onClick={build}
          disabled={loading || items.length === 0}
          className="w-full h-12 rounded-full bg-accent text-background font-medium flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Build outfit
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted text-center">Add some items to your closet first.</p>
      )}

      {suggestion && suggestion.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {suggestion.map(it => {
              const url = it.photo_path
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-photos/${it.photo_path}?width=400&height=400&resize=cover&quality=80`
                : null;
              return (
                <Link href={`/closet/${it.id}`} key={it.id} className="block">
                  <div className="relative aspect-square card overflow-hidden">
                    {url ? (
                      <Image src={url} alt={it.name} fill sizes="50vw" className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-3xl">👕</div>
                    )}
                  </div>
                  <p className="text-sm mt-1.5 font-medium truncate">{it.name}</p>
                </Link>
              );
            })}
          </div>
          <button
            onClick={logIt}
            className="w-full h-12 rounded-full border border-border font-medium"
          >
            Log this as today&apos;s outfit
          </button>
        </div>
      )}
    </div>
  );
}
