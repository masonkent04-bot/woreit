import Link from "next/link";
import { Plus, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ItemCard from "@/components/ItemCard";
import EmptyState from "@/components/EmptyState";
import type { ClosetItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ClosetPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("closet_items")
    .select("*")
    .eq("owner_id", user!.id)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false });

  if (filter === "new") query = query.eq("status", "new");
  if (filter === "underworn") query = query.in("status", ["new", "light"]);
  if (filter === "favorites") query = query.gte("rating", 4);

  const { data: items } = await query;
  const list = (items as ClosetItem[]) ?? [];

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Closet</h1>
        <Link
          href="/closet/new"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent text-background"
          aria-label="Add item"
        >
          <Plus size={20} />
        </Link>
      </header>

      <FilterBar current={filter ?? "all"} />

      {list.length === 0 ? (
        <EmptyState
          icon="👚"
          title="Your closet is empty"
          description="Add the first item with a photo and a name. The more you add, the better the AI suggestions get."
          actionLabel="Add an item"
          actionHref="/closet/new"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {list.map((it) => <ItemCard key={it.id} item={it} />)}
        </div>
      )}
    </div>
  );
}

function FilterBar({ current }: { current: string }) {
  const opts = [
    { id: "all", label: "All" },
    { id: "new", label: "Never worn" },
    { id: "underworn", label: "Underworn" },
    { id: "favorites", label: "★ Favorites" },
  ];
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
      {opts.map((o) => (
        <Link
          key={o.id}
          href={o.id === "all" ? "/closet" : `/closet?filter=${o.id}`}
          className={`shrink-0 inline-flex items-center gap-1 h-9 px-4 rounded-full text-sm border ${
            current === o.id
              ? "bg-accent text-background border-accent"
              : "border-border bg-card text-foreground"
          }`}
        >
          {o.id === "all" && <Filter size={14} />} {o.label}
        </Link>
      ))}
    </div>
  );
}
