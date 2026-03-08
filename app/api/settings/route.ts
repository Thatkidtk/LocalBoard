import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { jsonError, jsonErrorResponse, parseJson } from "@/lib/http";
import { enforceMutationGuard } from "@/lib/security/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { settingsSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return jsonError("Supabase is not configured for settings updates in this environment.", 503);
  }

  try {
    const currentUser = await requireCurrentUser({ verified: true });
    const payload = await parseJson(request, settingsSchema);

    await enforceMutationGuard({
      request,
      currentUser,
      actionLabel: "update your profile",
      userLimit: {
        scope: "settings:update:user",
        maxRequests: 12,
        windowSeconds: 60 * 60,
        message: "Too many profile updates in a short period. Try again later.",
      },
      ipLimit: {
        scope: "settings:update:ip",
        maxRequests: 30,
        windowSeconds: 60 * 60,
        message: "Too many profile updates from this network. Try again later.",
      },
    });

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        username: payload.username,
        home_community_id: payload.homeCommunityId,
        avatar_path: payload.avatarPath ?? null,
      })
      .eq("id", currentUser.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonErrorResponse(error, "Unable to save settings.");
  }
}
