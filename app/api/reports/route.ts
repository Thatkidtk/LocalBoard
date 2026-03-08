import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { parseJson, jsonError } from "@/lib/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reportCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return jsonError("Supabase is not configured for moderation in this environment.", 503);
  }

  try {
    const currentUser = await requireCurrentUser();
    const payload = await parseJson(request, reportCreateSchema);
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: currentUser.id,
        reason: payload.reason,
        details: payload.details ?? null,
        target_type: payload.targetType,
        target_id: payload.targetId,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ report: data }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to file report.", 400);
  }
}
