import Link from "next/link";
import Image from "next/image";
import { Plus, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

interface WishlistItem {
  id: string;
  owner_id: string;
  name: string;
  photo_path: string | null;
  photo_url: string | null;
  link_url: string | null;
  price: number | null;
  notes: string | null;
  created_at: string;
  profiles: { display_name: string } | null;
}

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Wishlist visibility is RLS-controlled: own + extended household/family.
  // Group by owner so the page shows "Your wishlist" + others'.
  const { data } = await supabase
    .from("wishlist_items")
    .select("*, profiles ( display_name )")
    .order("created_at", { ascending: false });
  const items = (data ?? []) as unknown as WishlistItem[];

  const mine = items.filter(i => i.owner_id === user!.id);
  const others = items.filter(i => i.owner_id !== user!.id);

  return (
    <div className="space-y-6 pb-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Heart size={22} /> Wishlist
        </h1>
        <Link
          href="/wishlist/new"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent text-background"
          aria-label="Add wishlist item"
        >
          <Plus size={20} />
        </Link>
      </header>

      <p className="text-xs text-muted">
        Things you want to buy. Shared with family so duplicate purchases are avoided.
      </p>

      {items.length === 0 && (
        <EmptyState
          icon="💭"
          title="Wishlist is empty"
          description="Drop in things you're eyeing — photos, links, prices. Stops duplicate purchases and helps family pick out gifts."
          actionLabel="Add wish"
          actionHref="/wishlist/new"
        />
      )}

      {mine.length > 0 && (
        <Section title="Yours">
          <Grid items={mine} />
        </Section>
      )}

      {others.length > 0 && (
        <Section title="Family">
          <Grid items={others} showOwner />
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </div>
  );
}

function Grid({ items, showOwner = false }: { items: WishlistItem[]; showOwner?: boolean }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map(it => {
        const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const photoUrl = it.photo_path
          ? `${base}/storage/v1/object/public/item-photos/${it.photo_path}?width=600&height=600&resize=cover&quality=80`
          : it.photo_url;
        return (
          <Link key={it.id} href={`/wishlist/${it.id}`} className="block">
            <div className="relative aspect-square card overflow-hidden">
              {photoUrl ? (
                <Image src={photoUrl} alt={it.name} fill sizes="33vw" className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-4xl text-muted">💭</div>
              )}
            </div>
            <p className="text-sm font-medium truncate pt-2 px-1">{it.name}</p>
            <p className="text-xs text-muted px-1">
              {showOwner && it.profiles?.display_name ? `${it.profiles.display_name} · ` : ""}
              {it.price != null ? `$${Number(it.price).toFixed(2)}` : "—"}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
