import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function HouseholdPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!membership) {
    return <EmptyState icon="🏠" title="No household yet" description="Create or join one to get started." actionLabel="Set up" actionHref="/onboarding" />;
  }

  const [{ data: household }, { data: members }] = await Promise.all([
    supabase.from("households").select("*").eq("id", membership.household_id).single(),
    supabase
      .from("household_members")
      .select("user_id, role, profiles ( id, display_name )")
      .eq("household_id", membership.household_id),
  ]);

  type Member = {
    user_id: string;
    role: string;
    profiles: { id: string; display_name: string } | null;
  };
  const memberList = (members ?? []) as unknown as Member[];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-muted uppercase tracking-wide">Your household</p>
        <h1 className="text-2xl font-semibold tracking-tight">{household?.name}</h1>
      </div>

      <div className="card p-4">
        <p className="text-xs uppercase tracking-wide text-muted">Invite housemates</p>
        <p className="text-2xl font-mono tracking-widest mt-1">{household?.invite_code}</p>
        <p className="text-xs text-muted mt-2">Share this 6-char code with anyone you live with — they enter it during onboarding.</p>
      </div>

      <div className="space-y-2">
        <h2 className="text-xs uppercase tracking-wide text-muted">Housemates</h2>
        {memberList.map(m => (
          <Link
            key={m.user_id}
            href={`/family/member/${m.user_id}`}
            className="card p-3 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-sm font-medium border border-border">
              {m.profiles?.display_name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1">
              <p className="font-medium">
                {m.profiles?.display_name ?? "Member"}
                {m.role === "organizer" && (
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-muted">organizer</span>
                )}
                {m.user_id === user?.id && (
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-muted">you</span>
                )}
              </p>
              <p className="text-xs text-muted">View closet →</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
