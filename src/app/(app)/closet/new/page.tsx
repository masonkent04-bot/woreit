"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PhotoUpload from "@/components/PhotoUpload";
import {
  CATEGORY_LABELS,
  STYLE_TAGS,
  OCCASION_TAGS,
  SEASON_TAGS,
  type ItemCategory,
} from "@/lib/types";

export default function NewItemPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ItemCategory>("top");
  const [subcategory, setSubcategory] = useState("");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [fitsLike, setFitsLike] = useState("");
  const [colorPrimary, setColorPrimary] = useState("");
  const [price, setPrice] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [comfort, setComfort] = useState<number | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [styleTags, setStyleTags] = useState<string[]>([]);
  const [occasionTags, setOccasionTags] = useState<string[]>([]);
  const [seasonTags, setSeasonTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  // Wear-history seed: lets users initially categorize items they already own.
  // Maps to (wear_count, status) so the trigger keeps tracking from there.
  const [wearHistory, setWearHistory] = useState<"new" | "light" | "frequent" | "heavy">("new");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [autofilling, setAutofilling] = useState(false);
  const [autofillNote, setAutofillNote] = useState<string | null>(null);

  async function autofillFromPhoto(path: string) {
    setAutofilling(true);
    setAutofillNote(null);
    try {
      const res = await fetch("/api/ai/auto-tag", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ photo_path: path }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAutofillNote(json.error || "Couldn't auto-fill — fill in manually");
        return;
      }
      const t = json.tags;
      // Only fill empty fields so we don't clobber user edits if they re-run
      if (t.name && !name) setName(t.name);
      if (t.category) setCategory(t.category);
      if (t.subcategory && !subcategory) setSubcategory(t.subcategory);
      if (t.color_primary && !colorPrimary) setColorPrimary(t.color_primary);
      if (t.style_tags?.length && styleTags.length === 0) setStyleTags(t.style_tags);
      if (t.occasion_tags?.length && occasionTags.length === 0) setOccasionTags(t.occasion_tags);
      if (t.season_tags?.length && seasonTags.length === 0) setSeasonTags(t.season_tags);
      setAutofillNote("AI filled in what it could — review and edit anything wrong");
    } catch (e) {
      setAutofillNote((e as Error).message);
    } finally {
      setAutofilling(false);
    }
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from("profiles").select("family_id").eq("id", user.id).single();
      setFamilyId((data?.family_id as string) ?? null);
    })();
  }, [supabase]);

  function toggle(arr: string[], val: string, set: (v: string[]) => void) {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  // Map the chosen wear history to a seeded count + status so future outfit
  // logs continue from a realistic baseline (and cost/wear math stays honest).
  const WEAR_SEED: Record<typeof wearHistory, { count: number; status: typeof wearHistory }> = {
    new: { count: 0, status: "new" },
    light: { count: 2, status: "light" },
    frequent: { count: 7, status: "frequent" },
    heavy: { count: 20, status: "heavy" },
  };

  async function save() {
    if (!userId || !name) return;
    setSaving(true); setErr(null);
    const seed = WEAR_SEED[wearHistory];
    const { error } = await supabase.from("closet_items").insert({
      owner_id: userId,
      family_id: familyId,
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
      style_tags: styleTags,
      occasion_tags: occasionTags,
      season_tags: seasonTags,
      notes: notes.trim() || null,
      wear_count: seed.count,
      status: seed.status,
    });
    setSaving(false);
    if (error) setErr(error.message);
    else router.push("/closet");
  }

  return (
    <div className="space-y-6 pb-6">
      <header className="flex items-center gap-2">
        <Link href="/closet" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-card">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Add item</h1>
      </header>

      {userId && (
        <PhotoUpload
          bucket="item-photos"
          userId={userId}
          onUploaded={(p) => {
            setPhotoPath(p);
            // Auto-trigger AI fill as soon as the photo finishes uploading
            autofillFromPhoto(p);
          }}
        />
      )}

      {photoPath && (
        <button
          type="button"
          onClick={() => photoPath && autofillFromPhoto(photoPath)}
          disabled={autofilling}
          className="w-full h-11 rounded-full border border-border font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles size={16} className={autofilling ? "animate-pulse" : ""} />
          {autofilling ? "Reading photo with AI…" : "Re-run AI autofill"}
        </button>
      )}

      {autofillNote && (
        <p className="text-xs text-muted text-center">{autofillNote}</p>
      )}

      <div className="space-y-3">
        <Field label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Blue chambray shirt"
            className="w-full h-11 px-4 rounded-full border border-border bg-background"
          />
        </Field>

        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ItemCategory)}
            className="w-full h-11 px-4 rounded-full border border-border bg-background"
          >
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand">
            <input value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full h-11 px-4 rounded-full border border-border bg-background" />
          </Field>
          <Field label="Labeled size">
            <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="M, 32x32, 8" className="w-full h-11 px-4 rounded-full border border-border bg-background" />
          </Field>
        </div>

        <Field label="Fits like (real-world fit)">
          <input
            value={fitsLike}
            onChange={(e) => setFitsLike(e.target.value)}
            placeholder='e.g., "fits like a small", "runs long"'
            className="w-full h-11 px-4 rounded-full border border-border bg-background"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Color">
            <input value={colorPrimary} onChange={(e) => setColorPrimary(e.target.value)} placeholder="navy" className="w-full h-11 px-4 rounded-full border border-border bg-background" />
          </Field>
          <Field label="Price">
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" placeholder="0.00" className="w-full h-11 px-4 rounded-full border border-border bg-background" />
          </Field>
        </div>

        <Field label="Rating">
          <StarRow value={rating} onChange={setRating} />
        </Field>

        <Field label="Comfort">
          <StarRow value={comfort} onChange={setComfort} />
        </Field>

        <Field label="Style">
          <TagRow options={[...STYLE_TAGS]} selected={styleTags} onToggle={(t) => toggle(styleTags, t, setStyleTags)} />
        </Field>

        <Field label="Occasion">
          <TagRow options={[...OCCASION_TAGS]} selected={occasionTags} onToggle={(t) => toggle(occasionTags, t, setOccasionTags)} />
        </Field>

        <Field label="Season">
          <TagRow options={[...SEASON_TAGS]} selected={seasonTags} onToggle={(t) => toggle(seasonTags, t, setSeasonTags)} />
        </Field>

        <Field label="How often have you worn this so far?">
          <div className="grid grid-cols-2 gap-2">
            {([
              ["new", "Never worn"],
              ["light", "A few times"],
              ["frequent", "Often"],
              ["heavy", "A lot"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setWearHistory(key)}
                className={`h-10 px-3 rounded-full text-sm border ${
                  wearHistory === key
                    ? "bg-accent text-background border-accent"
                    : "border-border bg-card"
                }`}
              >{label}</button>
            ))}
          </div>
          <p className="text-xs text-muted">Seeds the wear count. Filters and cost-per-wear math start from here, then track new wears automatically.</p>
        </Field>

        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-2xl border border-border bg-background"
          />
        </Field>
      </div>

      {err && <p className="text-sm text-danger">{err}</p>}

      <button
        onClick={save}
        disabled={saving || !name || !userId}
        className="w-full h-12 rounded-full bg-accent text-background font-medium disabled:opacity-40"
      >
        {saving ? "Saving…" : "Save item"}
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
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-2xl ${value && n <= value ? "text-warn" : "text-border"}`}
          aria-label={`${n} star`}
        >★</button>
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
        <button
          key={o}
          type="button"
          onClick={() => onToggle(o)}
          className={`px-3 h-8 rounded-full text-xs border capitalize ${
            selected.includes(o)
              ? "bg-accent text-background border-accent"
              : "border-border bg-card"
          }`}
        >{o}</button>
      ))}
    </div>
  );
}
