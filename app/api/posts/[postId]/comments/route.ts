import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { jsonError, jsonErrorResponse, parseJson } from "@/lib/http";
import { enforceMutationGuard } from "@/lib/security/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { commentCreateSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ postId: string }> },
) {
  if (!hasSupabaseEnv()) {
    return jsonError("Supabase is not configured for mutations in this environment.", 503);
  }

  try {
    const currentUser = await requireCurrentUser({ verified: true });
    const { postId } = await context.params;
    const payload = await parseJson(request, commentCreateSchema);

    if (payload.postId !== postId) {
      return jsonError("Post ID mismatch.", 400);
    }
    if (payload.parentCommentId) {
      return jsonError("Top-level comments cannot include a parent comment.", 400);
    }

    await enforceMutationGuard({
      request,
      currentUser,
      actionLabel: "add comments",
      userLimit: {
        scope: "comments:create:user",
        maxRequests: 25,
        windowSeconds: 10 * 60,
        message: "You are commenting too quickly. Slow down for a moment.",
      },
      ipLimit: {
        scope: "comments:create:ip",
        maxRequests: 60,
        windowSeconds: 10 * 60,
        message: "This network is commenting too quickly. Slow down for a moment.",
      },
      content: {
        scope: "comment",
        body: payload.body,
        maxLinks: 3,
        duplicateWindowSeconds: 15 * 60,
        duplicateMessage: "That comment looks like a duplicate. Edit the previous one instead.",
      },
    });

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("comments")
      .insert({
        author_id: currentUser.id,
        body: payload.body,
        post_id: postId,
        parent_comment_id: payload.parentCommentId ?? null,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (error) {
    return jsonErrorResponse(error, "Unable to add comment.");
  }
}
