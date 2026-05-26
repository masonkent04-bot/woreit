import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ItemCard from "@/components/ItemCard";
import EmptyState from "@/components/EmptyState";
import type { ClosetItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MemberClosetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles").select("display_name").eq("id", id).maybeSingle();

  if (!profile) return notFound();

  const { data: items } = await supabase
    .from("closet_items")
    .select("*")
    .eq("owner_id", id)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false });

  const list = (items as ClosetItem[]) ?? [];

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-2">
        <Link href="/family" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-card">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">{profile.display_name}&apos;s closet</h1>
      </header>

      {list.length === 0 ? (
        <EmptyState icon="👔" title="Empty closet" description="They haven't added items yet." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {list.map(it => <ItemCard key={it.id} item={it} href={`/closet/${it.id}`} />)}
        </div>
      )}
    </div>
  );
}
