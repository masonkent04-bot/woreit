"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Member {
  user_id: string;
  display_name: string;
}

interface ActiveBorrow {
  id: string;
  borrower_id: string;
  borrowed_at: string;
  borrower_name: string | null;
}

// Lend/return for an owned item.
// Shows current active borrows (if any), lets owner mark as returned,
// or pick a household/family member to lend to.
export default function BorrowActions({ itemId }: { itemId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [active, setActive] = useState<ActiveBorrow[]>([]);
  const [pending, start] = useTransition();
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Household-level borrowers (everyone in extended user set, excluding self)
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, display_name")
        .neq("id", user.id);
      setMembers((profileRows ?? []).map(p => ({ user_id: p.id, display_name: p.display_name })));

      // Currently lent (returned_at is null)
      const { data: borrows } = await supabase
        .from("borrow_log")
        .select("id, borrower_id, borrowed_at, profiles!borrow_log_borrower_id_fkey ( display_name )")
        .eq("item_id", itemId)
        .is("returned_at", null);
      const list = (borrows ?? []) as unknown as Array<{
        id: string; borrower_id: string; borrowed_at: string;
        profiles: { display_name: string } | null;
      }>;
      setActive(list.map(b => ({
        id: b.id,
        borrower_id: b.borrower_id,
        borrowed_at: b.borrowed_at,
        borrower_name: b.profiles?.display_name ?? null,
      })));
    })();
  }, [supabase, itemId]);

  async function lend(borrowerId: string) {
    start(async () => {
      await supabase.from("borrow_log").insert({
        item_id: itemId,
        borrower_id: borrowerId,
        borrowed_at: new Date().toISOString(),
      });
      setPicking(false);
      router.refresh();
      // Refetch
      const { data: borrows } = await supabase
        .from("borrow_log")
        .select("id, borrower_id, borrowed_at, profiles!borrow_log_borrower_id_fkey ( display_name )")
        .eq("item_id", itemId)
        .is("returned_at", null);
      const list = (borrows ?? []) as unknown as Array<{
        id: string; borrower_id: string; borrowed_at: string;
        profiles: { display_name: string } | null;
      }>;
      setActive(list.map(b => ({
        id: b.id, borrower_id: b.borrower_id, borrowed_at: b.borrowed_at,
        borrower_name: b.profiles?.display_name ?? null,
      })));
    });
  }

  async function markReturned(borrowId: string) {
    start(async () => {
      await supabase.from("borrow_log")
        .update({ returned_at: new Date().toISOString() })
        .eq("id", borrowId);
      setActive(active.filter(a => a.id !== borrowId));
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {active.length > 0 && (
        <div className="card p-3 space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted">Currently lent</p>
          {active.map(a => (
            <div key={a.id} className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">{a.borrower_name ?? "Someone"}</span>
                <span className="text-muted text-xs ml-1">since {new Date(a.borrowed_at).toLocaleDateString()}</span>
              </div>
              <button
                onClick={() => markReturned(a.id)}
                disabled={pending}
                className="h-8 px-3 rounded-full bg-success/10 text-success text-xs font-medium border border-success/30 flex items-center gap-1"
              >
                <Check size={12} /> Returned
              </button>
            </div>
          ))}
        </div>
      )}

      {picking ? (
        <div className="card p-3 space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted">Lend to</p>
          {members.length === 0 && <p className="text-sm text-muted">No other members visible.</p>}
          {members.map(m => (
            <button
              key={m.user_id}
              onClick={() => lend(m.user_id)}
              disabled={pending}
              className="w-full h-10 px-3 rounded-full border border-border text-sm font-medium text-left flex items-center justify-between"
            >
              <span>{m.display_name}</span>
              <span className="text-muted text-xs">Lend →</span>
            </button>
          ))}
          <button onClick={() => setPicking(false)} className="text-xs text-muted underline w-full">
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setPicking(true)}
          className="w-full h-11 rounded-full border border-border font-medium flex items-center justify-center gap-2 text-sm"
        >
          <ArrowRightLeft size={16} /> Lend to someone
        </button>
      )}
    </div>
  );
}
