import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { ClosetItem } from "@/lib/types";
import WearStatusBadge from "@/components/WearStatusBadge";
import ItemActions from "./ItemActions";

export const dynamic = "force-dynamic";

export default async function ItemDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("closet_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) return notFound();
  const item = data as ClosetItem;
  const isOwner = user?.id === item.owner_id;

  const url = item.photo_path
    ? supabase.storage.from("item-photos").getPublicUrl(item.photo_path, {
        transform: { width: 900, height: 900, resize: "cover", quality: 85 },
      }).data.publicUrl
    : null;

  return (
    <div className="space-y-5 pb-6">
      <header className="flex items-center gap-2">
        <Link href="/closet" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-card">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-semibold tracking-tight flex-1 truncate">{item.name}</h1>
      </header>

      <div className="relative aspect-square card overflow-hidden">
        {url ? (
          <Image src={url} alt={item.name} fill sizes="100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl text-muted">👕</div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <WearStatusBadge status={item.status} count={item.wear_count} />
        {item.last_worn_at && (
          <span className="text-xs text-muted">
            Last worn {new Date(item.last_worn_at).toLocaleDateString()}
          </span>
        )}
      </div>

      <dl className="card p-4 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
        <Row k="Category" v={item.category} />
        {item.brand && <Row k="Brand" v={item.brand} />}
        {item.size && <Row k="Labeled size" v={item.size} />}
        {item.fits_like && <Row k="Fits like" v={item.fits_like} />}
        {item.color_primary && <Row k="Color" v={item.color_primary} />}
        {item.purchase_price != null && (
          <Row
            k="Cost / wear"
            v={
              item.wear_count > 0
                ? `$${(item.purchase_price / item.wear_count).toFixed(2)}`
                : `$${item.purchase_price.toFixed(2)} new`
            }
          />
        )}
        {item.rating && <Row k="Rating" v={"★".repeat(item.rating)} />}
        {item.comfort && <Row k="Comfort" v={"♥".repeat(item.comfort)} />}
      </dl>

      {(item.style_tags.length > 0 || item.occasion_tags.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {[...item.style_tags, ...item.occasion_tags, ...item.season_tags].map(t => (
            <span key={t} className="text-xs px-2.5 h-7 inline-flex items-center rounded-full border border-border bg-card capitalize">{t}</span>
          ))}
        </div>
      )}

      {item.notes && <p className="text-sm text-muted whitespace-pre-wrap">{item.notes}</p>}

      {isOwner && <ItemActions itemId={item.id} />}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-muted capitalize">{k}</dt>
      <dd className="text-right capitalize">{v}</dd>
    </>
  );
}
