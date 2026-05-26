import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Check if user has a family. If not, send to onboarding
    const { data: profile } = await supabase
      .from("profiles")
      .select("family_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.family_id) redirect("/onboarding");
    redirect("/closet");
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="text-6xl">👕</div>
        <h1 className="text-4xl font-semibold tracking-tight">WoreIt</h1>
        <p className="text-muted text-lg leading-relaxed">
          Your family&apos;s closet, organized. Track what you own, log what you wore,
          and never wonder &ldquo;do I wear this enough?&rdquo; again.
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-12 rounded-full bg-accent text-background font-medium px-6"
          >
            Get started
          </Link>
        </div>
        <ul className="text-sm text-muted text-left pt-6 space-y-2">
          <li>• Snap photos of every item in your closet</li>
          <li>• Tap items you wore today, calendar logs the rest</li>
          <li>• See &ldquo;never worn&rdquo; vs &ldquo;worn a lot&rdquo; at a glance</li>
          <li>• AI builds outfits from what you own</li>
          <li>• Share your closet read-only with family</li>
        </ul>
      </div>
    </main>
  );
}
