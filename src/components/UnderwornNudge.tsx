import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { ClosetItem } from "@/lib/types";

// Surface 3 items the user hasn't worn yet, with a CTA to log one.
// Renders only when there are >=3 never-worn items.
export default function UnderwornNudge({ items }: { items: ClosetItem[] }) {
  const neverWorn = items.filter(i => i.status === "new" && !i.is_laundry && !i.is_archived);
  if (neverWorn.length < 3) return null;

  // Pick 3 random underworn items to surface
  const picks = [...neverWorn].sort(() => Math.random() - 0.5).slice(0, 3);

  return (
    <div className="card p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-warn" />
        <p className="text-sm font-medium">
          {neverWorn.length} {neverWorn.length === 1 ? "item is" : "items are"} still tagless
        </p>
      </div>
      <p className="text-xs text-muted">
        Pick one to wear today and start tracking it:
      </p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {picks.map(it => {
          const url = it.photo_path
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-photos/${it.photo_path}?width=160&height=160&resize=cover&quality=70`
            : null;
          return (
            <Link key={it.id} href={`/closet/${it.id}`} className="shrink-0 text-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-border bg-background relative">
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={it.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">👕</div>
                )}
              </div>
              <p className="text-[10px] text-muted mt-1 truncate w-20">{it.name}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
