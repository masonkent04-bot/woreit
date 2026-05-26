"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ItemActions({ itemId }: { itemId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function logQuickWear() {
    start(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase
        .from("profiles").select("family_id").eq("id", user.id).single();
      const { data: outfit } = await supabase
        .from("outfits")
        .insert({
          owner_id: user.id,
          family_id: prof?.family_id ?? null,
          name: "Quick log",
        })
        .select()
        .single();
      if (outfit) {
        await supabase.from("outfit_items").insert({ outfit_id: outfit.id, item_id: itemId });
        router.refresh();
      }
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
        className="w-full h-12 rounded-full bg-accent text-background font-medium disabled:opacity-40"
      >
        I wore this today
      </button>
      <button
        onClick={archive}
        disabled={pending}
        className="w-full h-11 rounded-full border border-border font-medium disabled:opacity-40"
      >
        Move to donate pile
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
          className="w-full h-11 rounded-full text-danger text-sm"
        >
          Delete permanently
        </button>
      )}
    </div>
  );
}
