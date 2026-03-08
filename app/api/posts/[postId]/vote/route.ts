import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { jsonError, jsonErrorResponse, parseJson } from "@/lib/http";
import { enforceMutationGuard } from "@/lib/security/guards";
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
    const currentUser = await requireCurrentUser({ verified: true });
    const { postId } = await context.params;
    const payload = await parseJson(request, voteSchema);
    await enforceMutationGuard({
      request,
      currentUser,
      actionLabel: "vote",
      userLimit: {
        scope: "votes:post:user",
        maxRequests: 120,
        windowSeconds: 60,
        message: "You are voting too quickly. Try again in a moment.",
      },
      ipLimit: {
        scope: "votes:post:ip",
        maxRequests: 300,
        windowSeconds: 60,
        message: "This network is voting too quickly. Try again in a moment.",
      },
    });
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
    return jsonErrorResponse(error, "Unable to vote on post.");
  }
}
