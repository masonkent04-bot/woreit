import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/EmptyState";
import FamilyJoiner from "./FamilyJoiner";

export const dynamic = "force-dynamic";

interface FamilyWithHouseholds {
  family_id: string;
  families: {
    id: string;
    name: string;
    invite_code: string;
  } | null;
}

export default async function FamilyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // My household
  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!membership) {
    return <EmptyState icon="🏠" title="No household yet" description="Set up your household first." actionLabel="Set up" actionHref="/onboarding" />;
  }

  const { data: household } = await supabase
    .from("households").select("organizer_id").eq("id", membership.household_id).single();
  const isOrganizer = household?.organizer_id === user!.id;

  // Families my household is in
  const { data: familyLinks } = await supabase
    .from("family_households")
    .select(`family_id, families ( id, name, invite_code )`)
    .eq("household_id", membership.household_id);
  const families = (familyLinks ?? []) as unknown as FamilyWithHouseholds[];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Families</h1>
        <p className="text-sm text-muted mt-1">
          {families.length === 0
            ? "Your household isn't in any family yet."
            : `Your household is part of ${families.length} ${families.length === 1 ? "family" : "families"}.`}
        </p>
      </header>

      {isOrganizer && <FamilyJoiner />}

      {!isOrganizer && families.length === 0 && (
        <p className="text-sm text-muted text-center">Only your household organizer can create or join families.</p>
      )}

      <ul className="space-y-3">
        {families.map(link => {
          const fam = link.families;
          if (!fam) return null;
          return (
            <li key={fam.id}>
              <Link href={`/family/${fam.id}`} className="card p-4 block">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{fam.name}</span>
                  <span className="font-mono text-xs text-muted">{fam.invite_code}</span>
                </div>
                <p className="text-xs text-muted mt-1">Tap to see member households</p>
              </Link>
            </li>
          );
        })}
      </ul>

      {isOrganizer && families.length > 0 && (
        <Link
          href="/household"
          className="text-xs text-muted underline block text-center"
        >
          Manage your household
        </Link>
      )}
    </div>
  );
}
