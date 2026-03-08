import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { parseJson, jsonError } from "@/lib/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { postCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return jsonError("Supabase is not configured for mutations in this environment.", 503);
  }

  try {
    const currentUser = await requireCurrentUser();
    const payload = await parseJson(request, postCreateSchema);
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
    return jsonError(error instanceof Error ? error.message : "Unable to create post.", 400);
  }
}
