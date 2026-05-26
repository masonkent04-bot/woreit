"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PhotoUpload from "@/components/PhotoUpload";

export default function NewWishlistItem() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    })();
  }, [supabase]);

  async function save() {
    if (!userId || !name) return;
    setSaving(true); setErr(null);
    const { error } = await supabase.from("wishlist_items").insert({
      owner_id: userId,
      name: name.trim(),
      photo_path: photoPath,
      link_url: linkUrl.trim() || null,
      price: price ? Number(price) : null,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) setErr(error.message);
    else router.push("/wishlist");
  }

  return (
    <div className="space-y-6 pb-6">
      <header className="flex items-center gap-2">
        <Link href="/wishlist" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-card">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Heart size={20} /> Add to wishlist
        </h1>
      </header>

      {userId && (
        <PhotoUpload
          bucket="item-photos"
          userId={userId}
          onUploaded={(p) => setPhotoPath(p)}
        />
      )}

      <div className="space-y-3">
        <Field label="What is it?">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vintage levi's denim jacket"
            className="w-full h-11 px-4 rounded-full border border-border bg-background"
          />
        </Field>

        <Field label="Link (optional)">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="w-full h-11 px-4 rounded-full border border-border bg-background"
          />
        </Field>

        <Field label="Price (optional)">
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-full h-11 px-4 rounded-full border border-border bg-background"
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Why you want it, size, when it's on sale..."
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
        {saving ? "Saving…" : "Add to wishlist"}
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
