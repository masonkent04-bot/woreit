import Link from "next/link";
import { Plus, Plane, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

interface Trip {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
}

export default async function TripsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trips")
    .select("id, name, destination, start_date, end_date")
    .order("start_date", { ascending: false, nullsFirst: false });

  const trips = (data ?? []) as Trip[];
  const today = new Date().toISOString().split("T")[0];
  const upcoming = trips.filter(t => !t.end_date || t.end_date >= today);
  const past = trips.filter(t => t.end_date && t.end_date < today);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Plane size={22} /> Trips
        </h1>
        <Link
          href="/trips/new"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent text-background"
          aria-label="Plan trip"
        >
          <Plus size={20} />
        </Link>
      </header>

      <p className="text-xs text-muted">
        Plan outfits day-by-day. When you pack, the planner is your checklist.
      </p>

      {trips.length === 0 && (
        <EmptyState
          icon="✈️"
          title="No trips planned"
          description="Plan your next trip and pack with confidence. AI can suggest outfits for each day based on destination, weather, and occasion."
          actionLabel="Plan a trip"
          actionHref="/trips/new"
        />
      )}

      {upcoming.length > 0 && (
        <Section title="Upcoming">
          {upcoming.map(t => <TripCard key={t.id} trip={t} />)}
        </Section>
      )}

      {past.length > 0 && (
        <Section title="Past">
          {past.map(t => <TripCard key={t.id} trip={t} />)}
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

function TripCard({ trip }: { trip: Trip }) {
  const days = trip.start_date && trip.end_date
    ? Math.floor((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000) + 1
    : null;

  return (
    <li>
      <Link href={`/trips/${trip.id}`} className="card p-4 block">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{trip.name}</p>
            {trip.destination && (
              <p className="text-sm text-muted truncate">{trip.destination}</p>
            )}
            {trip.start_date && (
              <p className="text-xs text-muted mt-1 flex items-center gap-1">
                <Calendar size={11} />
                {new Date(trip.start_date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                {trip.end_date && trip.end_date !== trip.start_date &&
                  ` – ${new Date(trip.end_date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
                {days && ` · ${days} ${days === 1 ? "day" : "days"}`}
              </p>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
