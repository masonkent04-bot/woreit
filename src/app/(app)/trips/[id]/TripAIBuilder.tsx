"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, RefreshCw } from "lucide-react";

// AI: generates outfit suggestions for the entire trip in one go.
// Calls the existing /api/ai/outfit-builder N times (one per day) with trip context
// baked into the occasion string. Then bulk-inserts trip_outfits.
export default function TripAIBuilder({
  tripId,
  destination,
  notes,
  dayCount,
  existingDayCount,
}: {
  tripId: string;
  destination: string | null;
  notes: string | null;
  dayCount: number;
  existingDayCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function planTrip() {
    setLoading(true);
    setErr(null);
    try {
      const ctx = [destination && `at ${destination}`, notes && `notes: ${notes}`]
        .filter(Boolean).join(" — ");

      const res = await fetch("/api/ai/trip-builder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ trip_id: tripId, context: ctx, day_count: dayCount }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-3 space-y-2">
      <button
        onClick={planTrip}
        disabled={loading}
        className="w-full h-11 rounded-full bg-accent text-background font-medium flex items-center justify-center gap-2 disabled:opacity-40"
      >
        {loading
          ? <><RefreshCw size={14} className="animate-spin" /> Planning {dayCount} days…</>
          : <><Sparkles size={14} /> {existingDayCount > 0 ? "Re-plan with AI" : "AI plan all days"}</>
        }
      </button>
      {existingDayCount > 0 && !loading && (
        <p className="text-[10px] text-muted text-center">Replaces existing planned outfits.</p>
      )}
      {err && <p className="text-xs text-danger text-center">{err}</p>}
    </div>
  );
}
