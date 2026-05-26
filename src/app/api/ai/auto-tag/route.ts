import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// AI autofill: send the item photo to Claude vision, get back structured
// metadata that pre-fills the new-item form. User can edit if anything's wrong.

const Body = z.object({ photo_path: z.string().min(1) });

const SYSTEM_PROMPT = `You are a fashion-cataloging assistant. The user uploaded a photo of a single clothing item to add to their personal closet inventory.

Extract the item's attributes and respond ONLY with a JSON object matching this exact schema. No prose, no markdown fences.

{
  "name": string (3-5 words, descriptive, e.g. "Navy chambray button-down"),
  "category": one of "top" | "bottom" | "dress" | "skirt" | "outerwear" | "shoes" | "accessory" | "bag" | "jewelry" | "underwear" | "sleepwear" | "activewear" | "swimwear" | "other",
  "subcategory": string or null (e.g. "blouse", "boyfriend jeans", "sneakers"),
  "color_primary": string (the dominant color, plain English, e.g. "burnt orange", "navy", "cream"),
  "color_secondary": string or null (only if there's a clear second color or pattern),
  "style_tags": array of 0-3 strings from ["casual", "dressy", "athletic", "vintage", "trendy", "classic", "bohemian", "edgy", "preppy", "minimalist"],
  "season_tags": array of 0-4 strings from ["spring", "summer", "fall", "winter"] (which seasons this works in),
  "occasion_tags": array of 0-3 strings from ["church", "work", "casual", "date", "party", "gym", "lounging", "errands"]
}

Be conservative — if you're not sure, leave a field null or empty.`;

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

  // Build the public URL and fetch the image
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const imageUrl = `${baseUrl}/storage/v1/object/public/item-photos/${parsed.data.photo_path}?width=800&height=800&resize=contain&quality=85`;

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }
  const buf = Buffer.from(await imgRes.arrayBuffer());
  const base64 = buf.toString("base64");
  const mediaType = (imgRes.headers.get("content-type") ?? "image/jpeg") as
    | "image/jpeg" | "image/png" | "image/webp" | "image/gif";

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: "Catalog this item." },
          ],
        },
      ],
    });

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map(b => b.text)
      .join("");

    // Strip any accidental markdown fences
    const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    const tags = JSON.parse(clean);

    return NextResponse.json({ tags });
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
