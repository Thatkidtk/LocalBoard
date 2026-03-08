import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { parseJson, jsonError } from "@/lib/http";
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
    const currentUser = await requireCurrentUser();
    const { commentId } = await context.params;
    const payload = await parseJson(request, commentCreateSchema);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("comments")
      .insert({
        author_id: currentUser.id,
        body: payload.body,
        post_id: payload.postId,
        parent_comment_id: commentId,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to reply to comment.", 400);
  }
}
