import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({ code: z.string().length(6) });

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid code" }, { status: 422 });

  const { data: household, error } = await supabase
    .rpc("join_household", { p_code: parsed.data.code })
    .single();

  if (error) {
    const m = error.message ?? "";
    if (m.includes("invalid_code")) return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    if (m.includes("already_in_household")) return NextResponse.json({ error: "You're already in a household" }, { status: 400 });
    return NextResponse.json({ error: m || "Failed" }, { status: 500 });
  }

  return NextResponse.json({ household });
}
