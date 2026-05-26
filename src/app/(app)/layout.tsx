import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Force users without a family through onboarding
  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.family_id) redirect("/onboarding");

  return (
    <>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-safe pb-24">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
