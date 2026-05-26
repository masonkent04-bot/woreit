"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FamilyJoiner() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(endpoint: string, body: object) {
    setLoading(true); setErr(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      router.refresh();
      setMode("choose"); setName(""); setCode("");
    } catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div className="card p-4 space-y-3">
      {mode === "choose" && (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setMode("create")}
            className="h-11 rounded-full bg-accent text-background font-medium text-sm">
            + Create family
          </button>
          <button onClick={() => setMode("join")}
            className="h-11 rounded-full border border-border font-medium text-sm">
            Join with code
          </button>
        </div>
      )}

      {mode === "create" && (
        <form onSubmit={(e) => { e.preventDefault(); submit("/api/family/create", { name: name.trim() }); }} className="space-y-2">
          <input required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Family name" className="w-full h-11 px-4 rounded-full border border-border bg-background" />
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 h-11 rounded-full bg-accent text-background font-medium disabled:opacity-50">
              {loading ? "Creating…" : "Create"}
            </button>
            <button type="button" onClick={() => setMode("choose")} className="h-11 px-4 rounded-full border border-border text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "join" && (
        <form onSubmit={(e) => { e.preventDefault(); submit("/api/family/join", { code: code.trim() }); }} className="space-y-2">
          <input required value={code} maxLength={6}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCDEF"
            className="w-full h-11 px-4 rounded-full border border-border bg-background uppercase tracking-widest text-center" />
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 h-11 rounded-full bg-accent text-background font-medium disabled:opacity-50">
              {loading ? "Joining…" : "Join"}
            </button>
            <button type="button" onClick={() => setMode("choose")} className="h-11 px-4 rounded-full border border-border text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {err && <p className="text-sm text-danger text-center">{err}</p>}
    </div>
  );
}
