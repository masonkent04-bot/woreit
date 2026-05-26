"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Smile } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ReactionRow {
  reactor_id: string;
  emoji: string;
  profiles: { display_name: string } | null;
}

// Quick-react palette. Keep it focused — too many options dilute the signal.
const PALETTE = ["❤️", "🔥", "😍", "👏", "👌", "🤩", "😂", "💯"];

export default function Reactions({
  outfitId,
  initial,
  currentUserId,
}: {
  outfitId: string;
  initial: ReactionRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [reactions, setReactions] = useState<ReactionRow[]>(initial);
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();

  // Group by emoji for display: { "❤️": [reactor1, reactor2], ... }
  const grouped = reactions.reduce<Record<string, ReactionRow[]>>((acc, r) => {
    (acc[r.emoji] ??= []).push(r);
    return acc;
  }, {});

  async function toggle(emoji: string) {
    const mine = reactions.find(r => r.reactor_id === currentUserId && r.emoji === emoji);
    if (mine) {
      // Optimistic remove
      setReactions(reactions.filter(r => !(r.reactor_id === currentUserId && r.emoji === emoji)));
      start(async () => {
        await supabase.from("outfit_reactions").delete()
          .eq("outfit_id", outfitId).eq("reactor_id", currentUserId).eq("emoji", emoji);
        router.refresh();
      });
    } else {
      // Optimistic add (we don't have the user's profile yet but it'll arrive on refresh)
      setReactions([...reactions, { reactor_id: currentUserId, emoji, profiles: { display_name: "You" } }]);
      setOpen(false);
      start(async () => {
        await supabase.from("outfit_reactions")
          .insert({ outfit_id: outfitId, reactor_id: currentUserId, emoji });
        router.refresh();
      });
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(grouped).map(([emoji, rs]) => {
          const mine = rs.some(r => r.reactor_id === currentUserId);
          const names = rs.map(r => r.profiles?.display_name ?? "?").join(", ");
          return (
            <button
              key={emoji}
              onClick={() => toggle(emoji)}
              title={names}
              className={`h-9 px-3 rounded-full text-sm border flex items-center gap-1.5 ${
                mine ? "bg-accent/10 border-accent" : "bg-card border-border"
              }`}
            >
              <span>{emoji}</span>
              <span className="text-xs text-muted">{rs.length}</span>
            </button>
          );
        })}
        <button
          onClick={() => setOpen(!open)}
          aria-label="Add reaction"
          className="h-9 px-3 rounded-full text-sm border border-border bg-card flex items-center gap-1"
        >
          <Smile size={14} /> <span className="text-xs">React</span>
        </button>
      </div>

      {open && (
        <div className="card p-2 flex flex-wrap gap-1">
          {PALETTE.map(e => (
            <button
              key={e}
              onClick={() => toggle(e)}
              className="w-10 h-10 rounded-full hover:bg-background text-2xl"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
