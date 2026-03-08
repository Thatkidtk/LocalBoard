import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { jsonErrorResponse, parseJson } from "@/lib/http";
import { enforceMutationGuard } from "@/lib/security/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notificationReadSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ok: true });
  }

  try {
    const currentUser = await requireCurrentUser({ verified: true });
    const payload = await parseJson(request, notificationReadSchema);
    await enforceMutationGuard({
      request,
      currentUser,
      actionLabel: "update notifications",
      userLimit: {
        scope: "notifications:read:user",
        maxRequests: 120,
        windowSeconds: 60,
        message: "You are updating notifications too quickly. Try again shortly.",
      },
      ipLimit: {
        scope: "notifications:read:ip",
        maxRequests: 300,
        windowSeconds: 60,
        message: "This network is updating notifications too quickly. Try again shortly.",
      },
    });
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", currentUser.id)
      .in("id", payload.notificationIds);

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonErrorResponse(error, "Unable to update notifications.");
  }
}
