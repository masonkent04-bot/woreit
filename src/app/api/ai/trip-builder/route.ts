import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// AI trip builder: generates outfit plan for N days, accounts for trip context
// (destination, notes about occasions). Single Claude call returns full plan.

const Body = z.object({
  trip_id: z.string().uuid(),
  context: z.string().optional(),
  day_count: z.number().min(1).max(30).default(7),
});

interface CompactItem {
  id: string;
  name: string;
  category: string;
  color: string | null;
  style_tags: string[];
  season_tags: string[];
  occasion_tags: string[];
  status: string;
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  // Verify trip belongs to user
  const { data: trip } = await supabase
    .from("trips").select("id, name").eq("id", parsed.data.trip_id).eq("owner_id", user.id).maybeSingle();
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  const { data: profile } = await supabase
    .from("profiles").select("display_name, prefers_modest, style_notes").eq("id", user.id).single();

  const { data: items } = await supabase
    .from("closet_items")
    .select("id, name, category, color_primary, style_tags, season_tags, occasion_tags, status")
    .eq("owner_id", user.id)
    .eq("is_archived", false)
    .eq("is_laundry", false)
    .limit(200);

  if (!items || items.length < 3) {
    return NextResponse.json({ error: "Need at least 3 items in your closet to plan a trip." }, { status: 400 });
  }

  const compact: CompactItem[] = items.map(i => ({
    id: i.id,
    name: i.name,
    category: i.category,
    color: i.color_primary,
    style_tags: i.style_tags ?? [],
    season_tags: i.season_tags ?? [],
    occasion_tags: i.occasion_tags ?? [],
    status: i.status,
  }));

  const modestyClause = profile?.prefers_modest
    ? "MODESTY (hard requirement): sleeves over sleeveless, knee+ hems, full coverage, prefer skirts/dresses over shorts. "
    : "";

  const systemPrompt = `You are a personal stylist planning trip outfits for ${profile?.display_name ?? "the user"}.

Trip context: ${parsed.data.context || "(none provided)"}

${modestyClause}${profile?.style_notes ? `Style notes from user: "${profile.style_notes}". ` : ""}

Generate a complete ${parsed.data.day_count}-day outfit plan. For each day, create 1-2 outfits ("day" + optional "evening" slot for dinners/events).

Items can be re-worn across days (especially bottoms, shoes, outerwear). Vary tops more than bottoms. Mix it up so the trip doesn't feel monotonous.

Output ONLY JSON array (no prose, no markdown):
[
  {
    "day_number": 1,
    "slot": "day" | "evening" | "workout" | "other",
    "name": "short evocative name",
    "occasion": "morning hike" | "beach dinner" | etc,
    "item_ids": ["uuid", ...],
    "notes": "one short sentence (optional)"
  },
  ...
]

Rules:
- 2-5 items per outfit (top + bottom + shoes minimum, OR dress + shoes)
- All item_ids must exist in the provided closet
- Prefer underworn items (status=new or light) where appropriate`;

  const userPrompt = `Closet (${compact.length} items):\n${JSON.stringify(compact)}`;

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map(b => b.text).join("");
    const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    const plan = JSON.parse(clean) as Array<{
      day_number: number;
      slot: string;
      name: string;
      occasion?: string;
      item_ids: string[];
      notes?: string;
    }>;

    const validIds = new Set(compact.map(c => c.id));
    const safe = plan
      .map(o => ({
        ...o,
        item_ids: o.item_ids.filter(id => validIds.has(id)),
      }))
      .filter(o => o.item_ids.length >= 2);

    if (safe.length === 0) {
      return NextResponse.json({ error: "AI couldn't build a plan from this closet." }, { status: 422 });
    }

    // Replace any existing trip outfits (re-plan = wipe + insert)
    await supabase.from("trip_outfits").delete().eq("trip_id", parsed.data.trip_id);

    // Insert new ones
    for (const o of safe) {
      const { data: to } = await supabase.from("trip_outfits").insert({
        trip_id: parsed.data.trip_id,
        day_number: o.day_number,
        slot: ["day","evening","workout","other"].includes(o.slot) ? o.slot : "day",
        name: o.name,
        occasion: o.occasion || null,
        notes: o.notes || null,
      }).select().single();
      if (to) {
        await supabase.from("trip_outfit_items").insert(
          o.item_ids.map(item_id => ({ trip_outfit_id: to.id, item_id }))
        );
      }
    }

    return NextResponse.json({ ok: true, count: safe.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
