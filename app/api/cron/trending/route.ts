import { NextResponse } from "next/server";

import { getCronSecret, hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { TRENDING_NOTIFICATION_LIMIT } from "@/lib/constants";
import { jsonError } from "@/lib/http";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return jsonError("Supabase is not configured for cron jobs in this environment.", 503);
  }

  const configuredSecret = getCronSecret();
  if (configuredSecret) {
    const incomingSecret = request.headers.get("x-cron-secret");
    if (incomingSecret !== configuredSecret) {
      return jsonError("Invalid cron secret.", 401);
    }
  }

  try {
    const supabase = createSupabaseServiceRoleClient();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id, title, community_id, author_id")
      .gte("created_at", since)
      .is("deleted_at", null)
      .order("hot_score", { ascending: false })
      .limit(TRENDING_NOTIFICATION_LIMIT * 10);

    if (postsError) {
      throw postsError;
    }

    const topPosts = (posts ?? []).slice(0, TRENDING_NOTIFICATION_LIMIT);
    if (!topPosts.length) {
      return NextResponse.json({ inserted: 0 });
    }

    const communityIds = [...new Set(topPosts.map((post) => post.community_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, home_community_id")
      .in("home_community_id", communityIds)
      .eq("is_suspended", false);

    if (profilesError) {
      throw profilesError;
    }

    const inserts = topPosts.flatMap((post) => {
      return (profiles ?? [])
        .filter((profile) => profile.home_community_id === post.community_id && profile.id !== post.author_id)
        .map((profile) => ({
          user_id: profile.id,
          actor_id: post.author_id,
          post_id: post.id,
          community_id: post.community_id,
          type: "trending_post",
          message: `${post.title} is trending in your area.`,
          dedupe_key: `trending:${profile.id}:${post.id}`,
        }));
    });

    if (!inserts.length) {
      return NextResponse.json({ inserted: 0 });
    }

    const { error: insertError } = await supabase
      .from("notifications")
      .upsert(inserts, { onConflict: "dedupe_key", ignoreDuplicates: true });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ inserted: inserts.length });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to generate trending notifications.",
      400,
    );
  }
}
