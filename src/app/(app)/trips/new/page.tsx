"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plane } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function NewTripPage() {
  const supabase = createClient();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("household_members").select("household_id").eq("user_id", user.id).maybeSingle();
      setHouseholdId(data?.household_id ?? null);
    })();
  }, [supabase]);

  async function save() {
    if (!userId || !name) return;
    setSaving(true); setErr(null);
    const { data: trip, error } = await supabase
      .from("trips")
      .insert({
        owner_id: userId,
        household_id: householdId,
        name: name.trim(),
        destination: destination.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        notes: notes.trim() || null,
      })
      .select()
      .single();
    setSaving(false);
    if (error) setErr(error.message);
    else router.push(`/trips/${trip.id}`);
  }

  return (
    <div className="space-y-6 pb-6">
      <header className="flex items-center gap-2">
        <Link href="/trips" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-card">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Plane size={20} /> Plan a trip
        </h1>
      </header>

      <div className="space-y-3">
        <Field label="Trip name">
          <input required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Hawaii anniversary"
            className="w-full h-11 px-4 rounded-full border border-border bg-background" />
        </Field>

        <Field label="Destination">
          <input value={destination} onChange={(e) => setDestination(e.target.value)}
            placeholder="Maui, HI"
            className="w-full h-11 px-4 rounded-full border border-border bg-background" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-11 px-4 rounded-full border border-border bg-background" />
          </Field>
          <Field label="End date">
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-11 px-4 rounded-full border border-border bg-background" />
          </Field>
        </div>

        <Field label="Notes (occasions, vibe, packing reminders)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
            placeholder="Beach during day, dressy dinners, one wedding rehearsal..."
            className="w-full p-3 rounded-2xl border border-border bg-background" />
        </Field>
      </div>

      {err && <p className="text-sm text-danger">{err}</p>}

      <button onClick={save} disabled={saving || !name}
        className="w-full h-12 rounded-full bg-accent text-background font-medium disabled:opacity-40">
        {saving ? "Creating…" : "Create trip"}
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
