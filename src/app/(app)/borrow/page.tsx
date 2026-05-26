import Link from "next/link";
import { ArrowLeft, ArrowRightLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

interface BorrowRow {
  id: string;
  borrower_id: string;
  borrowed_at: string;
  returned_at: string | null;
  item_id: string;
  closet_items: {
    id: string;
    name: string;
    owner_id: string;
    photo_path: string | null;
    profiles: { display_name: string } | null;
  } | null;
  profiles: { display_name: string } | null;
}

export default async function BorrowPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // RLS handles visibility: I see borrows where I'm borrower OR item owner.
  const { data } = await supabase
    .from("borrow_log")
    .select(`
      id, borrower_id, borrowed_at, returned_at, item_id,
      closet_items ( id, name, owner_id, photo_path, profiles!closet_items_owner_id_fkey ( display_name ) ),
      profiles!borrow_log_borrower_id_fkey ( display_name )
    `)
    .is("returned_at", null)
    .order("borrowed_at", { ascending: false });
  const rows = (data ?? []) as unknown as BorrowRow[];

  const lentOut = rows.filter(r => r.closet_items?.owner_id === user!.id);
  const borrowedFromOthers = rows.filter(r => r.borrower_id === user!.id);

  return (
    <div className="space-y-5 pb-6">
      <header className="flex items-center gap-2">
        <Link href="/settings" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-card">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <ArrowRightLeft size={20} /> Borrowed items
        </h1>
      </header>

      {rows.length === 0 && (
        <EmptyState
          icon="🔁"
          title="Nothing borrowed right now"
          description="When you lend items to family or borrow from them, the history shows up here."
        />
      )}

      {lentOut.length > 0 && (
        <Section title="You lent">
          {lentOut.map(r => (
            <Row
              key={r.id}
              item={r.closet_items}
              who={r.profiles?.display_name ?? "Someone"}
              since={r.borrowed_at}
              prefix="With"
            />
          ))}
        </Section>
      )}

      {borrowedFromOthers.length > 0 && (
        <Section title="You borrowed">
          {borrowedFromOthers.map(r => (
            <Row
              key={r.id}
              item={r.closet_items}
              who={r.closet_items?.profiles?.display_name ?? "Someone"}
              since={r.borrowed_at}
              prefix="From"
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs uppercase tracking-wide text-muted">{title}</h2>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function Row({ item, who, since, prefix }: {
  item: BorrowRow["closet_items"];
  who: string;
  since: string;
  prefix: string;
}) {
  if (!item) return null;
  const url = item.photo_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-photos/${item.photo_path}?width=120&height=120&resize=cover&quality=70`
    : null;
  return (
    <li>
      <Link href={`/closet/${item.id}`} className="card p-3 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden border border-border bg-background relative shrink-0">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">👕</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{item.name}</p>
          <p className="text-xs text-muted">
            {prefix} {who} · since {new Date(since).toLocaleDateString()}
          </p>
        </div>
      </Link>
    </li>
  );
}
