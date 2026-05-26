"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, RefreshCw, Cloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ClosetItem } from "@/lib/types";
import { OCCASION_TAGS } from "@/lib/types";

interface AISuggestion {
  name: string;
  item_ids: string[];
  reasoning: string;
}

export default function OutfitBuilderPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [itemsById, setItemsById] = useState<Map<string, ClosetItem>>(new Map());
  const [occasion, setOccasion] = useState<string>("casual");
  const [weather, setWeather] = useState<string>("");
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hasItems, setHasItems] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("closet_items")
        .select("*")
        .eq("owner_id", user.id)
        .eq("is_archived", false);
      const items = (data as ClosetItem[]) ?? [];
      const map = new Map<string, ClosetItem>();
      items.forEach(i => map.set(i.id, i));
      setItemsById(map);
      setHasItems(items.length > 0);
    })();
  }, [supabase]);

  async function build() {
    setLoading(true);
    setErr(null);
    setSuggestions([]);
    try {
      const res = await fetch("/api/ai/outfit-builder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          occasion,
          weather: weather || undefined,
          count: 3,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setSuggestions(json.outfits ?? []);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function logIt(suggestion: AISuggestion) {
    if (!userId) return;
    const { data: outfit } = await supabase
      .from("outfits")
      .insert({
        owner_id: userId,
        name: suggestion.name,
        occasion,
        ai_generated: true,
        notes: suggestion.reasoning,
      })
      .select()
      .single();
    if (outfit) {
      await supabase.from("outfit_items").insert(
        suggestion.item_ids.map(id => ({ outfit_id: outfit.id, item_id: id }))
      );
      window.location.href = `/outfits/${outfit.id}`;
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Sparkles size={22} /> AI outfit builder
        </h1>
        <p className="text-sm text-muted mt-1">
          Claude picks outfits from your closet — respects your modesty preference and style notes from settings.
        </p>
      </header>

      <div className="card p-4 space-y-3">
        <label className="text-xs uppercase tracking-wide text-muted block">Occasion</label>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {OCCASION_TAGS.map(o => (
            <button key={o} onClick={() => setOccasion(o)}
              className={`shrink-0 h-9 px-4 rounded-full text-sm capitalize border ${
                occasion === o ? "bg-accent text-background border-accent" : "border-border bg-background"
              }`}
            >{o}</button>
          ))}
        </div>

        <label className="text-xs uppercase tracking-wide text-muted block pt-2">Weather (optional)</label>
        <div className="relative">
          <Cloud size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            placeholder="e.g., 65°F and breezy, rainy, cold"
            className="w-full h-11 pl-10 pr-4 rounded-full border border-border bg-background text-sm"
          />
        </div>

        <button
          onClick={build}
          disabled={loading || !hasItems}
          className="w-full h-12 rounded-full bg-accent text-background font-medium flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Claude is thinking…" : suggestions.length > 0 ? "Build new outfits" : "Build outfits"}
        </button>
      </div>

      {!hasItems && (
        <p className="text-sm text-muted text-center">Add some items to your closet first.</p>
      )}

      {err && (
        <p className="text-sm text-danger text-center">{err}</p>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-4">
          {suggestions.map((s, idx) => {
            const items = s.item_ids.map(id => itemsById.get(id)).filter((x): x is ClosetItem => !!x);
            return (
              <div key={idx} className="card p-4 space-y-3">
                <div>
                  <h3 className="font-medium">{s.name}</h3>
                  {s.reasoning && (
                    <p className="text-xs text-muted mt-1 italic">{s.reasoning}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {items.map(it => {
                    const url = it.photo_path
                      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-photos/${it.photo_path}?width=300&height=300&resize=cover&quality=80`
                      : null;
                    return (
                      <Link key={it.id} href={`/closet/${it.id}`}>
                        <div className="relative aspect-square rounded-2xl border border-border overflow-hidden bg-background">
                          {url ? (
                            <Image src={url} alt={it.name} fill sizes="33vw" className="object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-2xl">👕</div>
                          )}
                        </div>
                        <p className="text-[10px] mt-1 truncate text-center">{it.name}</p>
                      </Link>
                    );
                  })}
                </div>

                <button
                  onClick={() => logIt(s)}
                  className="w-full h-10 rounded-full border border-border text-sm font-medium"
                >
                  Wear this today
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
