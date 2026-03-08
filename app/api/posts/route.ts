import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { jsonError, jsonErrorResponse, parseJson } from "@/lib/http";
import { enforceMutationGuard } from "@/lib/security/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { postCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return jsonError("Supabase is not configured for mutations in this environment.", 503);
  }

  try {
    const currentUser = await requireCurrentUser({ verified: true });
    const payload = await parseJson(request, postCreateSchema);
    await enforceMutationGuard({
      request,
      currentUser,
      actionLabel: "create posts",
      userLimit: {
        scope: "posts:create:user",
        maxRequests: 8,
        windowSeconds: 10 * 60,
        message: "You are posting too quickly. Try again in a few minutes.",
      },
      ipLimit: {
        scope: "posts:create:ip",
        maxRequests: 20,
        windowSeconds: 10 * 60,
        message: "This network is creating posts too quickly. Try again shortly.",
      },
      content: {
        scope: "post",
        title: payload.title,
        body: payload.body,
        maxLinks: 4,
        duplicateWindowSeconds: 2 * 60 * 60,
        duplicateMessage: "That looks like a duplicate post. Update the existing thread instead.",
      },
    });
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: currentUser.id,
        title: payload.title,
        body: payload.body,
        category: payload.category,
        community_id: payload.communityId,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (error) {
    return jsonErrorResponse(error, "Unable to create post.");
  }
}
