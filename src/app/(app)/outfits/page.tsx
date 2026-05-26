import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

interface OutfitWithItems {
  id: string;
  name: string | null;
  worn_at: string;
  photo_path: string | null;
  occasion: string | null;
  outfit_items: { item_id: string; closet_items: { name: string; photo_path: string | null } | null }[];
}

export default async function OutfitsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("outfits")
    .select(`
      id, name, worn_at, photo_path, occasion,
      outfit_items ( item_id, closet_items ( name, photo_path ) )
    `)
    .eq("owner_id", user!.id)
    .order("worn_at", { ascending: false })
    .limit(60);

  const outfits = (data ?? []) as unknown as OutfitWithItems[];

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Outfits</h1>
        <Link
          href="/outfits/new"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent text-background"
          aria-label="Log outfit"
        >
          <Plus size={20} />
        </Link>
      </header>

      {outfits.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No outfits logged yet"
          description="Log what you wore today and we'll track your wear stats automatically."
          actionLabel="Log an outfit"
          actionHref="/outfits/new"
        />
      ) : (
        <ul className="space-y-3">
          {outfits.map(o => (
            <li key={o.id}>
              <Link href={`/outfits/${o.id}`} className="card p-4 flex gap-3 items-center">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted">
                    {new Date(o.worn_at).toLocaleDateString(undefined, {
                      weekday: "short", month: "short", day: "numeric",
                    })}
                    {o.occasion ? ` · ${o.occasion}` : ""}
                  </div>
                  <div className="font-medium truncate">{o.name || "Outfit"}</div>
                  <div className="text-xs text-muted truncate">
                    {o.outfit_items.map(oi => oi.closet_items?.name).filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
                <ItemStack items={o.outfit_items} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemStack({ items }: { items: OutfitWithItems["outfit_items"] }) {
  return (
    <div className="flex -space-x-2">
      {items.slice(0, 3).map((oi, i) => {
        const p = oi.closet_items?.photo_path;
        return (
          <div key={i} className="w-12 h-12 rounded-full border-2 border-card overflow-hidden bg-background flex items-center justify-center text-lg">
            {p ? (
              <Thumb path={p} />
            ) : "👕"}
          </div>
        );
      })}
    </div>
  );
}

function Thumb({ path }: { path: string }) {
  // server-side public URL build via env to avoid client component
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const url = `${base}/storage/v1/object/public/item-photos/${path}?width=96&height=96&resize=cover&quality=70`;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="w-full h-full object-cover" />;
}
