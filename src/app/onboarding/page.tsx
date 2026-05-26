"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Onboarding() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [displayName, setDisplayName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function ensureName() {
    if (!displayName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: displayName.trim() }, { onConflict: "id" });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      await ensureName();
      const res = await fetch("/api/family/create", {
        method: "POST",
        body: JSON.stringify({ name: familyName.trim() }),
        headers: { "content-type": "application/json" },
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      router.push("/closet");
    } catch (e) {
      setErr((e as Error).message);
    } finally { setLoading(false); }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      await ensureName();
      const res = await fetch("/api/family/join", {
        method: "POST",
        body: JSON.stringify({ code: inviteCode.trim().toUpperCase() }),
        headers: { "content-type": "application/json" },
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      router.push("/closet");
    } catch (e) {
      setErr((e as Error).message);
    } finally { setLoading(false); }
  }

  return (
    <main className="flex-1 px-6 py-10 max-w-md mx-auto w-full space-y-6">
      <div className="text-center space-y-2">
        <div className="text-4xl">👕</div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to WoreIt</h1>
        <p className="text-sm text-muted">First, set up your family group.</p>
      </div>

      <div className="card p-4 space-y-3">
        <label className="text-xs uppercase tracking-wide text-muted">Your name</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Mason"
          className="w-full h-11 px-4 rounded-full border border-border bg-background"
        />
      </div>

      {mode === "choose" && (
        <div className="space-y-3">
          <button
            onClick={() => setMode("create")}
            disabled={!displayName.trim()}
            className="w-full h-12 rounded-full bg-accent text-background font-medium disabled:opacity-40"
          >
            Create a new family
          </button>
          <button
            onClick={() => setMode("join")}
            disabled={!displayName.trim()}
            className="w-full h-12 rounded-full border border-border font-medium disabled:opacity-40"
          >
            Join with invite code
          </button>
        </div>
      )}

      {mode === "create" && (
        <form onSubmit={handleCreate} className="card p-4 space-y-3">
          <label className="text-xs uppercase tracking-wide text-muted">Family name</label>
          <input
            required
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="The Doty Family"
            className="w-full h-11 px-4 rounded-full border border-border bg-background"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-accent text-background font-medium disabled:opacity-40"
          >
            {loading ? "Creating…" : "Create family"}
          </button>
          <button type="button" onClick={() => setMode("choose")} className="text-xs text-muted underline">
            Back
          </button>
        </form>
      )}

      {mode === "join" && (
        <form onSubmit={handleJoin} className="card p-4 space-y-3">
          <label className="text-xs uppercase tracking-wide text-muted">Invite code</label>
          <input
            required
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="DOTY42"
            maxLength={6}
            className="w-full h-11 px-4 rounded-full border border-border bg-background uppercase tracking-widest text-center"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-accent text-background font-medium disabled:opacity-40"
          >
            {loading ? "Joining…" : "Join family"}
          </button>
          <button type="button" onClick={() => setMode("choose")} className="text-xs text-muted underline">
            Back
          </button>
        </form>
      )}

      {err && <p className="text-sm text-danger text-center">{err}</p>}
    </main>
  );
}
