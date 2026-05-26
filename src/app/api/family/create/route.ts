import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({ name: z.string().min(1).max(60) });

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const { data: family, error } = await supabase
    .from("families")
    .insert({ name: parsed.data.name })
    .select()
    .single();
  if (error || !family) return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });

  const { error: profErr } = await supabase
    .from("profiles")
    .update({ family_id: family.id })
    .eq("id", user.id);
  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });

  return NextResponse.json({ family });
}
