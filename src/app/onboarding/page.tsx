"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Step = "name" | "household" | "family" | "done";

export default function Onboarding() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("name");
  const [displayName, setDisplayName] = useState("");
  const [familyMode, setFamilyMode] = useState<"choose" | "create" | "join" | "skip">("choose");
  const [householdMode, setHouseholdMode] = useState<"choose" | "create" | "join">("choose");
  const [householdName, setHouseholdName] = useState("");
  const [householdCode, setHouseholdCode] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [household, setHousehold] = useState<{ id: string; name: string; invite_code: string } | null>(null);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, display_name: displayName.trim() }, { onConflict: "id" });
      if (error) throw error;
      setStep("household");
    } catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }

  async function handleCreateHousehold(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/household/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: householdName.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setHousehold(j.household);
      setStep("family");
    } catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }

  async function handleJoinHousehold(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/household/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: householdCode.trim().toUpperCase() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setHousehold(j.household);
      // Joining household — they're done. Organizer handles family connections.
      router.push("/closet");
    } catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }

  async function handleCreateFamily(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/family/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: familyName.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      router.push("/closet");
    } catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }

  async function handleJoinFamily(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/family/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: familyCode.trim().toUpperCase() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      router.push("/closet");
    } catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <main className="flex-1 px-6 py-10 max-w-md mx-auto w-full space-y-6">
      <ProgressBar step={step} />

      {step === "name" && (
        <Section title="What should we call you?" subtitle="This is how your household and family see you.">
          <form onSubmit={saveName} className="space-y-3">
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Mason"
              className="w-full h-12 px-4 rounded-full border border-border bg-background"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !displayName.trim()}
              className="w-full h-12 rounded-full bg-accent text-background font-medium disabled:opacity-40"
            >
              {loading ? "Saving…" : "Continue"}
            </button>
          </form>
        </Section>
      )}

      {step === "household" && (
        <Section
          title="Set up your household"
          subtitle="A household is your home — you and anyone you live with. Items added by housemates are visible to each other."
        >
          {householdMode === "choose" && (
            <div className="space-y-3">
              <button
                onClick={() => setHouseholdMode("create")}
                className="w-full h-12 rounded-full bg-accent text-background font-medium"
              >
                Create a new household
              </button>
              <button
                onClick={() => setHouseholdMode("join")}
                className="w-full h-12 rounded-full border border-border font-medium"
              >
                Join an existing one with a code
              </button>
            </div>
          )}

          {householdMode === "create" && (
            <form onSubmit={handleCreateHousehold} className="space-y-3">
              <label className="text-xs uppercase tracking-wide text-muted">Household name</label>
              <input
                required value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="The Doty House"
                className="w-full h-12 px-4 rounded-full border border-border bg-background"
                autoFocus
              />
              <button type="submit" disabled={loading}
                className="w-full h-12 rounded-full bg-accent text-background font-medium disabled:opacity-40">
                {loading ? "Creating…" : "Create household"}
              </button>
              <button type="button" onClick={() => setHouseholdMode("choose")} className="text-xs text-muted underline">Back</button>
            </form>
          )}

          {householdMode === "join" && (
            <form onSubmit={handleJoinHousehold} className="space-y-3">
              <label className="text-xs uppercase tracking-wide text-muted">Household invite code</label>
              <input
                required value={householdCode} maxLength={6}
                onChange={(e) => setHouseholdCode(e.target.value.toUpperCase())}
                placeholder="ABCDEF"
                className="w-full h-12 px-4 rounded-full border border-border bg-background uppercase tracking-widest text-center"
                autoFocus
              />
              <button type="submit" disabled={loading}
                className="w-full h-12 rounded-full bg-accent text-background font-medium disabled:opacity-40">
                {loading ? "Joining…" : "Join household"}
              </button>
              <button type="button" onClick={() => setHouseholdMode("choose")} className="text-xs text-muted underline">Back</button>
            </form>
          )}
        </Section>
      )}

      {step === "family" && (
        <Section
          title="Connect to a family? (optional)"
          subtitle={
            household
              ? `Your household "${household.name}" can join one or more family groups — extended family members can see items you mark as 'household-shared'. Skip if you're not ready.`
              : "Skip if you're not ready."
          }
        >
          {familyMode === "choose" && (
            <div className="space-y-3">
              <button
                onClick={() => setFamilyMode("create")}
                className="w-full h-12 rounded-full bg-accent text-background font-medium"
              >
                Create a new family
              </button>
              <button
                onClick={() => setFamilyMode("join")}
                className="w-full h-12 rounded-full border border-border font-medium"
              >
                Join an existing family
              </button>
              <button
                onClick={() => router.push("/closet")}
                className="w-full h-11 rounded-full text-muted text-sm"
              >
                Skip for now — go to my closet
              </button>
            </div>
          )}

          {familyMode === "create" && (
            <form onSubmit={handleCreateFamily} className="space-y-3">
              <label className="text-xs uppercase tracking-wide text-muted">Family name</label>
              <input
                required value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="The Doty Family"
                className="w-full h-12 px-4 rounded-full border border-border bg-background"
                autoFocus
              />
              <button type="submit" disabled={loading}
                className="w-full h-12 rounded-full bg-accent text-background font-medium disabled:opacity-40">
                {loading ? "Creating…" : "Create family"}
              </button>
              <button type="button" onClick={() => setFamilyMode("choose")} className="text-xs text-muted underline">Back</button>
            </form>
          )}

          {familyMode === "join" && (
            <form onSubmit={handleJoinFamily} className="space-y-3">
              <label className="text-xs uppercase tracking-wide text-muted">Family invite code</label>
              <input
                required value={familyCode} maxLength={6}
                onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                placeholder="ABCDEF"
                className="w-full h-12 px-4 rounded-full border border-border bg-background uppercase tracking-widest text-center"
                autoFocus
              />
              <button type="submit" disabled={loading}
                className="w-full h-12 rounded-full bg-accent text-background font-medium disabled:opacity-40">
                {loading ? "Joining…" : "Join family"}
              </button>
              <button type="button" onClick={() => setFamilyMode("choose")} className="text-xs text-muted underline">Back</button>
            </form>
          )}
        </Section>
      )}

      {err && <p className="text-sm text-danger text-center">{err}</p>}
    </main>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <div className="text-4xl">👕</div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
      <div className="card p-4">{children}</div>
    </div>
  );
}

function ProgressBar({ step }: { step: Step }) {
  const steps = ["name", "household", "family"];
  const idx = steps.indexOf(step);
  return (
    <div className="flex gap-1.5">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`flex-1 h-1 rounded-full ${i <= idx ? "bg-accent" : "bg-border"}`}
        />
      ))}
    </div>
  );
}
