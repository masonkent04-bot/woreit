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

  // Why: family insert + profile update must be atomic, and the SELECT after
  // insert was failing RLS (policy gates on profile.family_id which wasn't
  // updated yet). RPC bypasses RLS via SECURITY DEFINER.
  const { data: family, error } = await supabase
    .rpc("create_family", { p_name: parsed.data.name })
    .single();

  if (error) {
    const msg = error.message?.includes("already_in_family")
      ? "You're already in a family"
      : error.message || "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ family });
}
