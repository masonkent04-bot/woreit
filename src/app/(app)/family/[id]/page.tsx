import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface HouseholdWithMembers {
  household_id: string;
  households: {
    id: string;
    name: string;
  } | null;
}

export default async function FamilyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: family } = await supabase
    .from("families").select("id, name, invite_code").eq("id", id).maybeSingle();
  if (!family) return notFound();

  const { data: householdLinks } = await supabase
    .from("family_households")
    .select(`household_id, households ( id, name )`)
    .eq("family_id", id);
  const households = (householdLinks ?? []) as unknown as HouseholdWithMembers[];

  // For each household, fetch members in parallel
  const householdsWithMembers = await Promise.all(
    households
      .filter((h): h is HouseholdWithMembers & { households: { id: string; name: string } } => h.households !== null)
      .map(async (h) => {
        const { data: members } = await supabase
          .from("household_members")
          .select("user_id, profiles ( id, display_name )")
          .eq("household_id", h.household_id);
        return { household: h.households, members: (members ?? []) as unknown as { user_id: string; profiles: { id: string; display_name: string } | null }[] };
      })
  );

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-2">
        <Link href="/family" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-card">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold tracking-tight truncate">{family.name}</h1>
          <p className="text-xs text-muted font-mono">Invite code: {family.invite_code}</p>
        </div>
      </header>

      <p className="text-xs text-muted">Share the invite code with another household to add them.</p>

      <div className="space-y-4">
        {householdsWithMembers.map(({ household, members }) => (
          <div key={household.id} className="card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-muted" />
              <h2 className="font-medium">{household.name}</h2>
            </div>
            <ul className="space-y-1.5">
              {members.map(m => (
                <li key={m.user_id}>
                  <Link
                    href={`/family/member/${m.user_id}`}
                    className="flex items-center gap-2 text-sm hover:underline"
                  >
                    <div className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center text-xs">
                      {m.profiles?.display_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span>{m.profiles?.display_name}</span>
                    <span className="text-xs text-muted ml-auto">View closet →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
