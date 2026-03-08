import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { parseJson, jsonError } from "@/lib/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { voteSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ postId: string }> },
) {
  if (!hasSupabaseEnv()) {
    return jsonError("Supabase is not configured for voting in this environment.", 503);
  }

  try {
    await requireCurrentUser();
    const { postId } = await context.params;
    const payload = await parseJson(request, voteSchema);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("toggle_post_vote", {
      target_post_id: postId,
      incoming_vote: payload.value,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ appliedValue: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to vote on post.", 400);
  }
}
