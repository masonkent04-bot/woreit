import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Calendar, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import TripDayPlanner from "./TripDayPlanner";
import TripAIBuilder from "./TripAIBuilder";
import type { ClosetItem } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Trip {
  id: string;
  owner_id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
}

interface TripOutfit {
  id: string;
  day_number: number;
  slot: "day" | "evening" | "workout" | "other";
  name: string | null;
  occasion: string | null;
  notes: string | null;
  trip_outfit_items: { item_id: string; closet_items: ClosetItem | null }[];
}

export default async function TripDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: tripData } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!tripData) return notFound();
  const trip = tripData as Trip;
  const isOwner = user?.id === trip.owner_id;

  // Existing trip outfits with full item data
  const { data: outfitsData } = await supabase
    .from("trip_outfits")
    .select(`
      id, day_number, slot, name, occasion, notes,
      trip_outfit_items ( item_id, closet_items (*) )
    `)
    .eq("trip_id", id)
    .order("day_number")
    .order("slot");
  const outfits = (outfitsData ?? []) as unknown as TripOutfit[];

  // User's items pool for adding to days
  const { data: itemsData } = isOwner
    ? await supabase
        .from("closet_items")
        .select("*")
        .eq("owner_id", user!.id)
        .eq("is_archived", false)
        .order("category")
    : { data: [] };
  const items = (itemsData as ClosetItem[]) ?? [];

  // Compute day count from dates (defaults to 7 if no dates)
  const dayCount = trip.start_date && trip.end_date
    ? Math.max(1, Math.floor(
        (new Date(trip.end_date + "T00:00:00").getTime() -
         new Date(trip.start_date + "T00:00:00").getTime()) / 86400000) + 1)
    : 7;

  return (
    <div className="space-y-5 pb-6">
      <header className="flex items-center gap-2">
        <Link href="/trips" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-card">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold tracking-tight truncate">{trip.name}</h1>
          <div className="flex items-center gap-2 text-xs text-muted">
            {trip.destination && (
              <span className="flex items-center gap-1"><MapPin size={11} /> {trip.destination}</span>
            )}
            {trip.start_date && (
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {new Date(trip.start_date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                {trip.end_date && trip.end_date !== trip.start_date &&
                  ` – ${new Date(trip.end_date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
              </span>
            )}
            <span>· {dayCount} {dayCount === 1 ? "day" : "days"}</span>
          </div>
        </div>
      </header>

      {trip.notes && (
        <p className="text-sm text-muted whitespace-pre-wrap card p-3">{trip.notes}</p>
      )}

      {isOwner && (
        <TripAIBuilder
          tripId={trip.id}
          destination={trip.destination}
          notes={trip.notes}
          dayCount={dayCount}
          existingDayCount={outfits.length}
        />
      )}

      <TripDayPlanner
        tripId={trip.id}
        dayCount={dayCount}
        outfits={outfits}
        items={items}
        isOwner={isOwner}
      />
    </div>
  );
}
