import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles").select("family_id").eq("id", user!.id).single();

  if (!profile?.family_id) {
    return <EmptyState icon="👨‍👩‍👧" title="No family yet" description="Set up your family first." actionLabel="Set up" actionHref="/onboarding" />;
  }

  const [{ data: family }, { data: members }] = await Promise.all([
    supabase.from("families").select("*").eq("id", profile.family_id).single(),
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("family_id", profile.family_id),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">{family?.name}</h1>

      <div className="card p-4">
        <p className="text-xs uppercase tracking-wide text-muted">Invite code</p>
        <p className="text-2xl font-mono tracking-widest mt-1">{family?.invite_code}</p>
        <p className="text-xs text-muted mt-2">Share this with family members so they can join.</p>
      </div>

      <div className="space-y-2">
        <h2 className="text-xs uppercase tracking-wide text-muted">Members</h2>
        {(members ?? []).map(m => (
          <Link
            key={m.id}
            href={`/family/${m.id}`}
            className="card p-3 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-sm font-medium border border-border">
              {m.display_name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1">
              <p className="font-medium">{m.display_name}</p>
              <p className="text-xs text-muted">View closet →</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
