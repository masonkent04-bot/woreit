"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [displayName, setDisplayName] = useState("");
  const [prefersModest, setPrefersModest] = useState(false);
  const [styleNotes, setStyleNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("profiles")
        .select("display_name, prefers_modest, style_notes")
        .eq("id", user.id)
        .single();
      if (data) {
        setDisplayName(data.display_name ?? "");
        setPrefersModest(!!data.prefers_modest);
        setStyleNotes(data.style_notes ?? "");
      }
    })();
  }, [supabase]);

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({
      display_name: displayName,
      prefers_modest: prefersModest,
      style_notes: styleNotes,
    }).eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <div className="card p-4 space-y-3">
        <Field label="Email">
          <input value={email} disabled className="w-full h-11 px-4 rounded-full border border-border bg-background text-muted" />
        </Field>

        <Field label="Display name">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full h-11 px-4 rounded-full border border-border bg-background" />
        </Field>

        <label className="flex items-center gap-3 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={prefersModest}
            onChange={(e) => setPrefersModest(e.target.checked)}
            className="w-5 h-5"
          />
          <span className="text-sm">
            <span className="font-medium">Modest preferences</span>
            <span className="text-muted block text-xs">AI outfit suggestions will favor longer hems and full coverage.</span>
          </span>
        </label>

        <Field label="Style notes (for AI)">
          <textarea
            value={styleNotes}
            onChange={(e) => setStyleNotes(e.target.value)}
            placeholder="e.g., love earth tones, avoid skinny jeans, prefer skirts to dresses"
            rows={3}
            className="w-full p-3 rounded-2xl border border-border bg-background"
          />
        </Field>

        <button
          onClick={save}
          disabled={saving}
          className="w-full h-11 rounded-full bg-accent text-background font-medium"
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </button>
      </div>

      <div className="card divide-y divide-border">
        <Link href="/wishlist" className="block p-4 flex items-center justify-between hover:bg-background/50">
          <span className="text-sm font-medium">💭 Wishlist</span>
          <span className="text-xs text-muted">→</span>
        </Link>
      </div>

      <button
        onClick={signOut}
        className="w-full h-11 rounded-full border border-border text-danger font-medium"
      >
        Sign out
      </button>

      <p className="text-xs text-center text-muted pt-4">
        WoreIt v0.1 · Made for the Doty family
      </p>
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
