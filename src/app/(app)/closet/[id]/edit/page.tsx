"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Users, User } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PhotoUpload from "@/components/PhotoUpload";
import {
  CATEGORY_LABELS, STYLE_TAGS, OCCASION_TAGS, SEASON_TAGS,
  type ItemCategory, type ItemScope, type ClosetItem,
} from "@/lib/types";

export default function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: itemId } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ItemCategory>("top");
  const [scope, setScope] = useState<ItemScope>("personal");
  const [subcategory, setSubcategory] = useState("");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [fitsLike, setFitsLike] = useState("");
  const [colorPrimary, setColorPrimary] = useState("");
  const [price, setPrice] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [comfort, setComfort] = useState<number | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [photoBackPath, setPhotoBackPath] = useState<string | null>(null);
  const [styleTags, setStyleTags] = useState<string[]>([]);
  const [occasionTags, setOccasionTags] = useState<string[]>([]);
  const [seasonTags, setSeasonTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isLaundry, setIsLaundry] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [autofilling, setAutofilling] = useState(false);
  const [autofillNote, setAutofillNote] = useState<string | null>(null);

  // Load existing item on mount + prefill all fields
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from("closet_items").select("*").eq("id", itemId).single();
      if (error || !data) {
        setLoadErr(error?.message ?? "Item not found");
        return;
      }
      const item = data as ClosetItem;
      if (item.owner_id !== user.id) {
        setLoadErr("You can only edit your own items.");
        return;
      }

      setName(item.name ?? "");
      setCategory(item.category);
      setScope(item.scope);
      setSubcategory(item.subcategory ?? "");
      setBrand(item.brand ?? "");
      setSize(item.size ?? "");
      setFitsLike(item.fits_like ?? "");
      setColorPrimary(item.color_primary ?? "");
      setPrice(item.purchase_price != null ? String(item.purchase_price) : "");
      setRating(item.rating);
      setComfort(item.comfort);
      setPhotoPath(item.photo_path);
      setPhotoBackPath(item.photo_back_path);
      setStyleTags(item.style_tags ?? []);
      setOccasionTags(item.occasion_tags ?? []);
      setSeasonTags(item.season_tags ?? []);
      setNotes(item.notes ?? "");
      setIsLaundry(item.is_laundry);
      setLoaded(true);
    })();
  }, [supabase, itemId]);

  function toggle(arr: string[], val: string, set: (v: string[]) => void) {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  async function autofillFromPhoto(frontPath: string, backPath: string | null) {
    setAutofilling(true);
    setAutofillNote(null);
    try {
      const res = await fetch("/api/ai/auto-tag", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ photo_path: frontPath, photo_back_path: backPath }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAutofillNote(json.error || "Couldn't auto-fill");
        return;
      }
      const t = json.tags;
      // Edit mode: overwrite each field, since user explicitly asked to re-run
      if (t.name) setName(t.name);
      if (t.category) setCategory(t.category);
      if (t.subcategory) setSubcategory(t.subcategory);
      if (t.color_primary) setColorPrimary(t.color_primary);
      if (t.style_tags) setStyleTags(t.style_tags);
      if (t.occasion_tags) setOccasionTags(t.occasion_tags);
      if (t.season_tags) setSeasonTags(t.season_tags);
      setAutofillNote("AI updated tags — adjust anything wrong");
    } catch (e) {
      setAutofillNote((e as Error).message);
    } finally {
      setAutofilling(false);
    }
  }

  async function save() {
    if (!userId || !name) return;
    setSaving(true); setErr(null);
    // Update: don't touch wear_count or status (those are tracked automatically)
    const { error } = await supabase.from("closet_items").update({
      scope,
      name: name.trim(),
      category,
      subcategory: subcategory.trim() || null,
      brand: brand.trim() || null,
      size: size.trim() || null,
      fits_like: fitsLike.trim() || null,
      color_primary: colorPrimary.trim() || null,
      purchase_price: price ? Number(price) : null,
      rating,
      comfort,
      photo_path: photoPath,
      photo_back_path: photoBackPath,
      style_tags: styleTags,
      occasion_tags: occasionTags,
      season_tags: seasonTags,
      notes: notes.trim() || null,
      is_laundry: isLaundry,
    }).eq("id", itemId);
    setSaving(false);
    if (error) setErr(error.message);
    else router.push(`/closet/${itemId}`);
  }

  if (loadErr) {
    return (
      <div className="space-y-4">
        <p className="text-danger">{loadErr}</p>
        <Link href={`/closet/${itemId}`} className="text-sm underline">Back to item</Link>
      </div>
    );
  }
  if (!loaded) return <p className="text-muted text-sm">Loading…</p>;

  return (
    <div className="space-y-6 pb-6">
      <header className="flex items-center gap-2">
        <Link href={`/closet/${itemId}`} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-card">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Edit item</h1>
      </header>

      {userId && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wide text-muted">Front photo</p>
            <PhotoUpload
              bucket="item-photos"
              userId={userId}
              initialPath={photoPath}
              onUploaded={(p) => setPhotoPath(p)}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wide text-muted">Back photo</p>
            <PhotoUpload
              bucket="item-photos"
              userId={userId}
              initialPath={photoBackPath}
              onUploaded={(p) => setPhotoBackPath(p)}
            />
          </div>
        </div>
      )}

      {photoPath && (
        <button
          type="button"
          onClick={() => photoPath && autofillFromPhoto(photoPath, photoBackPath)}
          disabled={autofilling}
          className="w-full h-11 rounded-full border border-border font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles size={16} className={autofilling ? "animate-pulse" : ""} />
          {autofilling ? "Re-tagging with AI…" : "Re-tag with AI"}
        </button>
      )}

      {autofillNote && <p className="text-xs text-muted text-center">{autofillNote}</p>}

      <div className="space-y-3">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full h-11 px-4 rounded-full border border-border bg-background" />
        </Field>

        <Field label="Who owns this?">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setScope("personal")}
              className={`h-11 px-3 rounded-full text-sm border flex items-center justify-center gap-1.5 ${
                scope === "personal" ? "bg-accent text-background border-accent" : "border-border bg-card"
              }`}>
              <User size={14} /> Just me
            </button>
            <button type="button" onClick={() => setScope("household")}
              className={`h-11 px-3 rounded-full text-sm border flex items-center justify-center gap-1.5 ${
                scope === "household" ? "bg-accent text-background border-accent" : "border-border bg-card"
              }`}>
              <Users size={14} /> Household-shared
            </button>
          </div>
        </Field>

        <Field label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value as ItemCategory)}
            className="w-full h-11 px-4 rounded-full border border-border bg-background">
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand">
            <input value={brand} onChange={(e) => setBrand(e.target.value)}
              className="w-full h-11 px-4 rounded-full border border-border bg-background" />
          </Field>
          <Field label="Labeled size">
            <input value={size} onChange={(e) => setSize(e.target.value)}
              className="w-full h-11 px-4 rounded-full border border-border bg-background" />
          </Field>
        </div>

        <Field label="Fits like">
          <input value={fitsLike} onChange={(e) => setFitsLike(e.target.value)}
            className="w-full h-11 px-4 rounded-full border border-border bg-background" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Color">
            <input value={colorPrimary} onChange={(e) => setColorPrimary(e.target.value)}
              className="w-full h-11 px-4 rounded-full border border-border bg-background" />
          </Field>
          <Field label="Price">
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01"
              className="w-full h-11 px-4 rounded-full border border-border bg-background" />
          </Field>
        </div>

        <Field label="Rating"><StarRow value={rating} onChange={setRating} /></Field>
        <Field label="Comfort"><StarRow value={comfort} onChange={setComfort} /></Field>
        <Field label="Style"><TagRow options={[...STYLE_TAGS]} selected={styleTags} onToggle={(t) => toggle(styleTags, t, setStyleTags)} /></Field>
        <Field label="Occasion"><TagRow options={[...OCCASION_TAGS]} selected={occasionTags} onToggle={(t) => toggle(occasionTags, t, setOccasionTags)} /></Field>
        <Field label="Season"><TagRow options={[...SEASON_TAGS]} selected={seasonTags} onToggle={(t) => toggle(seasonTags, t, setSeasonTags)} /></Field>

        <label className="card p-4 flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={isLaundry}
            onChange={(e) => setIsLaundry(e.target.checked)} className="w-5 h-5" />
          <span className="text-sm">
            <span className="font-medium">In laundry</span>
            <span className="text-muted block text-xs">Hide from outfit-builder until clean.</span>
          </span>
        </label>

        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            className="w-full p-3 rounded-2xl border border-border bg-background" />
        </Field>
      </div>

      {err && <p className="text-sm text-danger">{err}</p>}

      <button onClick={save} disabled={saving || !name}
        className="w-full h-12 rounded-full bg-accent text-background font-medium disabled:opacity-40">
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}

function StarRow({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={`text-2xl ${value && n <= value ? "text-warn" : "text-border"}`}
          aria-label={`${n} star`}>★</button>
      ))}
    </div>
  );
}

function TagRow({ options, selected, onToggle }: {
  options: string[]; selected: string[]; onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} type="button" onClick={() => onToggle(o)}
          className={`px-3 h-8 rounded-full text-xs border capitalize ${
            selected.includes(o) ? "bg-accent text-background border-accent" : "border-border bg-card"
          }`}>{o}</button>
      ))}
    </div>
  );
}
