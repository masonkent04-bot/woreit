"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shirt, Droplets, Archive, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ItemActions({ itemId }: { itemId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Track current laundry state locally so the button label updates instantly
  const [isLaundry, setIsLaundry] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("closet_items").select("is_laundry").eq("id", itemId).maybeSingle();
      setIsLaundry((data?.is_laundry as boolean) ?? false);
    })();
  }, [supabase, itemId]);

  async function logQuickWear() {
    start(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: outfit } = await supabase
        .from("outfits")
        .insert({ owner_id: user.id, name: "Quick log" })
        .select()
        .single();
      if (outfit) {
        await supabase.from("outfit_items").insert({ outfit_id: outfit.id, item_id: itemId });
        router.refresh();
      }
    });
  }

  async function toggleLaundry() {
    if (isLaundry === null) return;
    const next = !isLaundry;
    setIsLaundry(next); // optimistic
    start(async () => {
      const { error } = await supabase
        .from("closet_items").update({ is_laundry: next }).eq("id", itemId);
      if (error) setIsLaundry(!next); // rollback on error
      else router.refresh();
    });
  }

  async function archive() {
    start(async () => {
      await supabase.from("closet_items").update({ is_archived: true }).eq("id", itemId);
      router.push("/closet");
    });
  }

  async function deleteItem() {
    start(async () => {
      await supabase.from("closet_items").delete().eq("id", itemId);
      router.push("/closet");
    });
  }

  return (
    <div className="space-y-2">
      <button
        onClick={logQuickWear}
        disabled={pending}
        className="w-full h-12 rounded-full bg-accent text-background font-medium flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <Shirt size={16} /> I wore this today
      </button>

      <button
        onClick={toggleLaundry}
        disabled={pending || isLaundry === null}
        className={`w-full h-11 rounded-full font-medium flex items-center justify-center gap-2 border disabled:opacity-40 ${
          isLaundry
            ? "bg-warn/10 border-warn/30 text-warn"
            : "border-border bg-card"
        }`}
      >
        <Droplets size={16} /> {isLaundry ? "In laundry — tap to mark clean" : "Mark as in laundry"}
      </button>

      <button
        onClick={archive}
        disabled={pending}
        className="w-full h-11 rounded-full border border-border font-medium flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <Archive size={16} /> Move to donate pile
      </button>

      {confirmDelete ? (
        <div className="flex gap-2">
          <button
            onClick={deleteItem}
            disabled={pending}
            className="flex-1 h-11 rounded-full bg-danger text-background font-medium"
          >
            Yes, delete
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="flex-1 h-11 rounded-full border border-border"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="w-full h-11 rounded-full text-danger text-sm flex items-center justify-center gap-2"
        >
          <Trash2 size={14} /> Delete permanently
        </button>
      )}
    </div>
  );
}
