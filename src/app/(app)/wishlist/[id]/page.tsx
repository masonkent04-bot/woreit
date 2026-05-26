import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import WishlistActions from "./WishlistActions";

export const dynamic = "force-dynamic";

export default async function WishlistDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("wishlist_items")
    .select("*, profiles ( display_name )")
    .eq("id", id)
    .maybeSingle();

  if (!data) return notFound();
  const item = data as {
    id: string;
    owner_id: string;
    name: string;
    photo_path: string | null;
    photo_url: string | null;
    link_url: string | null;
    price: number | null;
    notes: string | null;
    profiles: { display_name: string } | null;
  };
  const isOwner = user?.id === item.owner_id;

  const photoUrl = item.photo_path
    ? supabase.storage.from("item-photos").getPublicUrl(item.photo_path, {
        transform: { width: 900, height: 900, resize: "cover", quality: 85 },
      }).data.publicUrl
    : item.photo_url;

  return (
    <div className="space-y-5 pb-6">
      <header className="flex items-center gap-2">
        <Link href="/wishlist" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-card">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-semibold tracking-tight flex-1 truncate">{item.name}</h1>
      </header>

      <div className="relative aspect-square card overflow-hidden">
        {photoUrl ? (
          <Image src={photoUrl} alt={item.name} fill sizes="100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl text-muted">💭</div>
        )}
      </div>

      <dl className="card p-4 space-y-3 text-sm">
        {item.profiles?.display_name && (
          <Row k="Wanted by" v={item.profiles.display_name} />
        )}
        {item.price != null && <Row k="Price" v={`$${Number(item.price).toFixed(2)}`} />}
      </dl>

      {item.link_url && (
        <a
          href={item.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card font-medium text-sm"
        >
          View product <ExternalLink size={14} />
        </a>
      )}

      {item.notes && <p className="text-sm text-muted whitespace-pre-wrap">{item.notes}</p>}

      {isOwner && <WishlistActions itemId={item.id} />}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
