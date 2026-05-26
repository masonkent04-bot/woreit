"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function WishlistActions({ itemId }: { itemId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);

  async function remove() {
    start(async () => {
      await supabase.from("wishlist_items").delete().eq("id", itemId);
      router.push("/wishlist");
    });
  }

  return (
    <div className="space-y-2">
      <button
        onClick={remove}
        disabled={pending}
        className="w-full h-11 rounded-full border border-border font-medium flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <Check size={16} /> Got it / no longer want
      </button>
      {confirm ? (
        <div className="flex gap-2">
          <button onClick={remove} disabled={pending}
            className="flex-1 h-11 rounded-full bg-danger text-background font-medium">
            Yes, delete
          </button>
          <button onClick={() => setConfirm(false)}
            className="flex-1 h-11 rounded-full border border-border">
            Cancel
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirm(true)}
          className="w-full h-11 rounded-full text-danger text-sm flex items-center justify-center gap-2">
          <Trash2 size={14} /> Delete
        </button>
      )}
    </div>
  );
}
