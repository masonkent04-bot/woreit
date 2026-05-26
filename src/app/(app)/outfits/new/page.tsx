"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PhotoUpload from "@/components/PhotoUpload";
import type { ClosetItem } from "@/lib/types";
import { OCCASION_TAGS } from "@/lib/types";

export default function NewOutfitPage() {
  const supabase = createClient();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState<string>("");
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const [{ data: prof }, { data: list }] = await Promise.all([
        supabase.from("profiles").select("family_id").eq("id", user.id).single(),
        supabase.from("closet_items").select("*").eq("owner_id", user.id).eq("is_archived", false).order("updated_at", { ascending: false }),
      ]);
      setFamilyId((prof?.family_id as string) ?? null);
      setItems((list as ClosetItem[]) ?? []);
    })();
  }, [supabase]);

  function toggle(id: string) {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  }

  async function save() {
    if (!userId || selected.size === 0) return;
    setSaving(true); setErr(null);
    const { data: outfit, error } = await supabase
      .from("outfits")
      .insert({
        owner_id: userId,
        family_id: familyId,
        name: name.trim() || null,
        occasion: occasion || null,
        photo_path: photoPath,
      })
      .select()
      .single();
    if (error || !outfit) { setErr(error?.message ?? "Failed"); setSaving(false); return; }

    const rows = Array.from(selected).map(item_id => ({ outfit_id: outfit.id, item_id }));
    const { error: oiErr } = await supabase.from("outfit_items").insert(rows);
    setSaving(false);
    if (oiErr) setErr(oiErr.message);
    else router.push("/outfits");
  }

  return (
    <div className="space-y-5 pb-6">
      <header className="flex items-center gap-2">
        <Link href="/outfits" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-card">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Log outfit</h1>
      </header>

      {userId && (
        <PhotoUpload bucket="outfit-photos" userId={userId} aspect="portrait" onUploaded={(p) => setPhotoPath(p)} />
      )}

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Optional name — e.g., Sunday morning"
        className="w-full h-11 px-4 rounded-full border border-border bg-background"
      />

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button onClick={() => setOccasion("")} className={`shrink-0 h-9 px-4 rounded-full text-sm border ${occasion === "" ? "bg-accent text-background border-accent" : "border-border bg-card"}`}>
          No occasion
        </button>
        {OCCASION_TAGS.map(o => (
          <button key={o} onClick={() => setOccasion(o)} className={`shrink-0 h-9 px-4 rounded-full text-sm capitalize border ${occasion === o ? "bg-accent text-background border-accent" : "border-border bg-card"}`}>
            {o}
          </button>
        ))}
      </div>

      <div>
        <h2 className="text-xs uppercase tracking-wide text-muted mb-2">Tap items you wore</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted">Add some items to your closet first.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {items.map(it => {
              const checked = selected.has(it.id);
              const url = it.photo_path
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-photos/${it.photo_path}?width=200&height=200&resize=cover&quality=70`
                : null;
              return (
                <button
                  key={it.id}
                  onClick={() => toggle(it.id)}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 ${checked ? "border-accent" : "border-transparent"}`}
                >
                  {url ? (
                    <Image src={url} alt={it.name} fill sizes="33vw" className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-2xl bg-card">👕</div>
                  )}
                  {checked && (
                    <span className="absolute top-1 right-1 w-6 h-6 rounded-full bg-accent text-background flex items-center justify-center">
                      <Check size={14} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {err && <p className="text-sm text-danger">{err}</p>}

      <button
        onClick={save}
        disabled={saving || selected.size === 0 || !userId}
        className="w-full h-12 rounded-full bg-accent text-background font-medium disabled:opacity-40"
      >
        {saving ? "Saving…" : `Log outfit (${selected.size} item${selected.size === 1 ? "" : "s"})`}
      </button>
    </div>
  );
}
