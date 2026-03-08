import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { jsonError, jsonErrorResponse, parseJson } from "@/lib/http";
import { enforceMutationGuard } from "@/lib/security/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { commentCreateSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ commentId: string }> },
) {
  if (!hasSupabaseEnv()) {
    return jsonError("Supabase is not configured for mutations in this environment.", 503);
  }

  try {
    const currentUser = await requireCurrentUser({ verified: true });
    const { commentId } = await context.params;
    const payload = await parseJson(request, commentCreateSchema);
    await enforceMutationGuard({
      request,
      currentUser,
      actionLabel: "reply to comments",
      userLimit: {
        scope: "comments:reply:user",
        maxRequests: 25,
        windowSeconds: 10 * 60,
        message: "You are replying too quickly. Slow down for a moment.",
      },
      ipLimit: {
        scope: "comments:reply:ip",
        maxRequests: 60,
        windowSeconds: 10 * 60,
        message: "This network is replying too quickly. Slow down for a moment.",
      },
      content: {
        scope: "comment",
        body: payload.body,
        maxLinks: 3,
        duplicateWindowSeconds: 15 * 60,
        duplicateMessage: "That reply looks like a duplicate. Edit the previous one instead.",
      },
    });
    const supabase = await createSupabaseServerClient();
    const { data: parentComment, error: parentCommentError } = await supabase
      .from("comments")
      .select("id, post_id")
      .eq("id", commentId)
      .maybeSingle();

    if (parentCommentError) {
      throw parentCommentError;
    }
    if (!parentComment) {
      return jsonError("Parent comment not found.", 404);
    }
    if (payload.parentCommentId && payload.parentCommentId !== commentId) {
      return jsonError("Parent comment ID mismatch.", 400);
    }
    if (payload.postId !== parentComment.post_id) {
      return jsonError("Reply post ID mismatch.", 400);
    }

    const { data, error } = await supabase
      .from("comments")
      .insert({
        author_id: currentUser.id,
        body: payload.body,
        post_id: parentComment.post_id,
        parent_comment_id: commentId,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (error) {
    return jsonErrorResponse(error, "Unable to reply to comment.");
  }
}
