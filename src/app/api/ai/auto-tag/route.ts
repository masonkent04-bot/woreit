import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// AI autofill: send the item photo(s) to Claude vision, get structured tags.
// Sending both front + back when available gives much better identification
// (e.g., graphics on the back, fit details, brand tags).

const Body = z.object({
  photo_path: z.string().min(1),
  photo_back_path: z.string().nullable().optional(),
});

const SYSTEM_PROMPT = `You are a fashion-cataloging assistant. The user uploaded photos of a single clothing item to add to their personal closet inventory. If two images are provided, they show FRONT and BACK of the same item.

Extract the item's attributes and respond ONLY with a JSON object matching this exact schema. No prose, no markdown fences.

{
  "name": string (3-5 words, descriptive, e.g. "Navy chambray button-down"),
  "category": one of "top" | "bottom" | "dress" | "skirt" | "outerwear" | "shoes" | "hat" | "accessory" | "bag" | "jewelry" | "underwear" | "sleepwear" | "activewear" | "swimwear" | "other",
  "subcategory": string or null (e.g. "blouse", "boyfriend jeans", "sneakers"),
  "color_primary": string (the dominant color, plain English, e.g. "burnt orange", "navy", "cream"),
  "color_secondary": string or null (only if there's a clear second color or pattern),
  "style_tags": array of 0-3 strings from ["casual", "dressy", "athletic", "vintage", "trendy", "classic", "bohemian", "edgy", "preppy", "minimalist"],
  "season_tags": array of 0-4 strings from ["spring", "summer", "fall", "winter"] (which seasons this works in),
  "occasion_tags": array of 0-3 strings from ["church", "work", "casual", "date", "party", "gym", "lounging", "errands"]
}

Be conservative — if you're not sure, leave a field null or empty.`;

type MediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

async function fetchAsBase64(path: string): Promise<{ data: string; mediaType: MediaType }> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const url = `${baseUrl}/storage/v1/object/public/item-photos/${path}?width=800&height=800&resize=contain&quality=85`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Photo not found");
  const buf = Buffer.from(await res.arrayBuffer());
  const mediaType = (res.headers.get("content-type") ?? "image/jpeg") as MediaType;
  return { data: buf.toString("base64"), mediaType };
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI autofill not configured. Add ANTHROPIC_API_KEY to environment variables." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  // Only allow auto-tagging photos in the user's own folder
  if (!parsed.data.photo_path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (parsed.data.photo_back_path && !parsed.data.photo_back_path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const front = await fetchAsBase64(parsed.data.photo_path);
    const back = parsed.data.photo_back_path
      ? await fetchAsBase64(parsed.data.photo_back_path)
      : null;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const content: Anthropic.ContentBlockParam[] = [
      { type: "image", source: { type: "base64", media_type: front.mediaType, data: front.data } },
    ];
    if (back) {
      content.push({ type: "image", source: { type: "base64", media_type: back.mediaType, data: back.data } });
    }
    content.push({
      type: "text",
      text: back ? "Two images: front then back of the same item. Catalog it." : "Catalog this item.",
    });

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map(b => b.text)
      .join("");

    const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    const tags = JSON.parse(clean);

    return NextResponse.json({ tags });
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
