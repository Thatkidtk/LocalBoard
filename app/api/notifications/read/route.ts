import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { parseJson, jsonError } from "@/lib/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notificationReadSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ok: true });
  }

  try {
    const currentUser = await requireCurrentUser();
    const payload = await parseJson(request, notificationReadSchema);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", currentUser.id)
      .in("id", payload.notificationIds);

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to update notifications.", 400);
  }
}
