import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ItemCard from "@/components/ItemCard";
import ClosetSummary from "@/components/ClosetSummary";
import UnderwornNudge from "@/components/UnderwornNudge";
import EmptyState from "@/components/EmptyState";
import ClosetFilters from "./ClosetFilters";
import type { ClosetItem, ItemCategory, WearStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type SP = {
  q?: string;
  status?: string;
  category?: string;
  scope?: string;
  season?: string;
  occasion?: string;
  laundry?: string;
  archived?: string;
};

export default async function ClosetPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Build query from filters. Each filter is single-select via URL params
  // to keep the URL parseable and shareable.
  let query = supabase
    .from("closet_items")
    .select("*")
    .eq("owner_id", user!.id)
    .order("updated_at", { ascending: false });

  // Default to non-archived unless explicitly viewing the donate pile
  query = sp.archived === "1"
    ? query.eq("is_archived", true)
    : query.eq("is_archived", false);

  if (sp.q) {
    // Search across name, brand, subcategory, color, category, tags, notes via the
    // search_text generated column. Normalize the query the same way (lower, strip
    // non-alphanumeric) so "tshirt" matches "t-shirt" and "hat" matches items with
    // category=hat even if named "baseball cap". Multi-word = all words must match.
    const normalized = sp.q.toLowerCase().replace(/[^a-z0-9\s]/gi, " ");
    const words = normalized.split(/\s+/).filter(w => w.length > 0);
    for (const word of words) {
      query = query.ilike("search_text", `%${word}%`);
    }
  }
  if (sp.status) {
    if (sp.status === "underworn") query = query.in("status", ["new", "light"]);
    else query = query.eq("status", sp.status as WearStatus);
  }
  if (sp.category) query = query.eq("category", sp.category as ItemCategory);
  if (sp.scope) query = query.eq("scope", sp.scope);
  if (sp.season) query = query.contains("season_tags", [sp.season]);
  if (sp.occasion) query = query.contains("occasion_tags", [sp.occasion]);
  if (sp.laundry === "1") query = query.eq("is_laundry", true);

  const { data: items } = await query;
  const list = (items as ClosetItem[]) ?? [];

  const hasFilters = Boolean(
    sp.q || sp.status || sp.category || sp.scope ||
    sp.season || sp.occasion || sp.laundry || sp.archived
  );

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

      {!hasFilters && (
        <>
          <ClosetSummary items={list} />
          <UnderwornNudge items={list} />
        </>
      )}

      <ClosetFilters params={sp} />

      {hasFilters && (
        <p className="text-xs text-muted">
          {list.length} item{list.length === 1 ? "" : "s"}
          {sp.q && ` matching "${sp.q}"`}
        </p>
      )}

      {list.length === 0 ? (
        <EmptyState
          icon={hasFilters ? "🔍" : "👚"}
          title={hasFilters ? "Nothing matches" : "Your closet is empty"}
          description={hasFilters
            ? "Try clearing some filters."
            : "Add the first item with a photo and a name. The more you add, the better the AI suggestions get."}
          actionLabel={hasFilters ? "Clear filters" : "Add an item"}
          actionHref={hasFilters ? "/closet" : "/closet/new"}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {list.map((it) => <ItemCard key={it.id} item={it} />)}
        </div>
      )}
    </div>
  );
}
