import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// Real Claude-powered outfit builder.
// Returns multiple outfit options with reasoning. Falls back to a graceful
// error if ANTHROPIC_API_KEY isn't set.

const Body = z.object({
  occasion: z.string().optional(),
  weather: z.string().optional(),
  count: z.number().min(1).max(5).default(2),
});

interface CompactItem {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  color: string | null;
  scope: string;
  status: string;
  wear_count: number;
  style_tags: string[];
  occasion_tags: string[];
  season_tags: string[];
  is_laundry: boolean;
}

function buildSystemPrompt(opts: {
  displayName: string;
  prefersModest: boolean;
  styleNotes: string | null;
  occasion: string | null;
  weather: string | null;
  count: number;
}) {
  const lines = [
    `You are a personal stylist building outfit options for ${opts.displayName} from their existing closet.`,
    "",
    "Output ONLY a JSON array (no prose, no markdown fences) of EXACTLY " + opts.count + " outfit objects:",
    `[{
  "name": "short evocative outfit name (3-5 words)",
  "item_ids": ["uuid", ...],
  "reasoning": "one short sentence (15 words max) explaining why this works"
}]`,
    "",
    "Rules:",
    "- Each outfit must include items from DIFFERENT categories (e.g., one top + one bottom + shoes — not two tops).",
    "- Or a dress alone with shoes and optional accessories.",
    "- Include 2-5 items per outfit. Always include shoes if available.",
    "- Prefer UNDERWORN items (status=new or light) to give them more wear.",
    "- Avoid items where is_laundry=true.",
    "- All item_ids MUST exist in the provided closet.",
  ];

  if (opts.occasion) {
    lines.push(`- Occasion: ${opts.occasion}. Match items with that occasion tag or appropriate vibe.`);
  }
  if (opts.weather) {
    lines.push(`- Weather: ${opts.weather}. Pick season-appropriate items.`);
  }
  if (opts.prefersModest) {
    lines.push(
      "- MODESTY: This user prefers modest dress. Prioritize: sleeves over sleeveless, " +
      "longer hems (knee-length+), full coverage. Prefer skirts/dresses over shorts. " +
      "Avoid plunging necklines or form-fitting reveal. This is a hard requirement, not a preference."
    );
  }
  if (opts.styleNotes) {
    lines.push(`- Style notes from user: "${opts.styleNotes}". Respect these.`);
  }

  return lines.join("\n");
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI builder not configured. Add ANTHROPIC_API_KEY to environment variables." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  // Profile for prefs
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, prefers_modest, style_notes")
    .eq("id", user.id)
    .single();

  // User's items, excluding archived + laundry, capped at 200 to bound prompt size
  const { data: items } = await supabase
    .from("closet_items")
    .select("id, name, category, subcategory, color_primary, scope, status, wear_count, style_tags, occasion_tags, season_tags, is_laundry")
    .eq("owner_id", user.id)
    .eq("is_archived", false)
    .order("status", { ascending: true }) // 'new' < 'light' < 'frequent' < 'heavy' alpha
    .limit(200);

  if (!items || items.length === 0) {
    return NextResponse.json(
      { error: "Add some items to your closet first." },
      { status: 400 }
    );
  }

  // Compact + flatten for prompt
  const compact: CompactItem[] = items.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    subcategory: i.subcategory,
    color: i.color_primary,
    scope: i.scope,
    status: i.status,
    wear_count: i.wear_count ?? 0,
    style_tags: i.style_tags ?? [],
    occasion_tags: i.occasion_tags ?? [],
    season_tags: i.season_tags ?? [],
    is_laundry: i.is_laundry,
  }));

  const systemPrompt = buildSystemPrompt({
    displayName: profile?.display_name ?? "the user",
    prefersModest: !!profile?.prefers_modest,
    styleNotes: profile?.style_notes ?? null,
    occasion: parsed.data.occasion ?? null,
    weather: parsed.data.weather ?? null,
    count: parsed.data.count,
  });

  const userPrompt = `Closet (${compact.length} items):\n${JSON.stringify(compact)}`;

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    const outfits = JSON.parse(clean);

    // Defensive validation: filter to known item IDs in case AI hallucinates
    const validIds = new Set(compact.map((c) => c.id));
    const safe = (outfits as Array<{ name: string; item_ids: string[]; reasoning?: string }>)
      .map((o) => ({
        name: o.name,
        item_ids: (o.item_ids || []).filter((id) => validIds.has(id)),
        reasoning: o.reasoning ?? "",
      }))
      .filter((o) => o.item_ids.length >= 2);

    if (safe.length === 0) {
      return NextResponse.json(
        { error: "AI couldn't build outfits from this closet. Try adding more variety." },
        { status: 422 }
      );
    }

    return NextResponse.json({ outfits: safe });
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
