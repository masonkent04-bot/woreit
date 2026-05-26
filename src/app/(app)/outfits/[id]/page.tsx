import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ItemCard from "@/components/ItemCard";
import type { ClosetItem, Outfit } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OutfitDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("outfits")
    .select(`
      *,
      outfit_items ( closet_items (*) )
    `)
    .eq("id", id)
    .maybeSingle();

  if (!data) return notFound();

  const outfit = data as Outfit & {
    outfit_items: { closet_items: ClosetItem | null }[];
  };

  const items = outfit.outfit_items
    .map(oi => oi.closet_items)
    .filter((x): x is ClosetItem => !!x);

  const photoUrl = outfit.photo_path
    ? supabase.storage.from("outfit-photos").getPublicUrl(outfit.photo_path, {
        transform: { width: 900, resize: "contain", quality: 85 },
      }).data.publicUrl
    : null;

  return (
    <div className="space-y-5 pb-6">
      <header className="flex items-center gap-2">
        <Link href="/outfits" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-card">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted">
            {new Date(outfit.worn_at).toLocaleString(undefined, {
              weekday: "long", month: "long", day: "numeric",
            })}
          </p>
          <h1 className="text-lg font-semibold tracking-tight truncate">{outfit.name || "Outfit"}</h1>
        </div>
      </header>

      {photoUrl && (
        <div className="relative aspect-[3/4] card overflow-hidden">
          <Image src={photoUrl} alt="Outfit photo" fill sizes="100vw" className="object-cover" />
        </div>
      )}

      <div>
        <h2 className="text-xs uppercase tracking-wide text-muted mb-2">Items</h2>
        <div className="grid grid-cols-3 gap-2">
          {items.map(it => <ItemCard key={it.id} item={it} />)}
        </div>
      </div>

      {outfit.notes && <p className="text-sm text-muted whitespace-pre-wrap">{outfit.notes}</p>}
    </div>
  );
}
