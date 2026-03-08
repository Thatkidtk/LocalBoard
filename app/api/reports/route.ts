import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { jsonError, jsonErrorResponse, parseJson } from "@/lib/http";
import { enforceMutationGuard } from "@/lib/security/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reportCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return jsonError("Supabase is not configured for moderation in this environment.", 503);
  }

  try {
    const currentUser = await requireCurrentUser({ verified: true });
    const payload = await parseJson(request, reportCreateSchema);
    await enforceMutationGuard({
      request,
      currentUser,
      actionLabel: "file reports",
      userLimit: {
        scope: "reports:create:user",
        maxRequests: 12,
        windowSeconds: 60 * 60,
        message: "You have filed too many reports in a short period. Try again later.",
      },
      ipLimit: {
        scope: "reports:create:ip",
        maxRequests: 30,
        windowSeconds: 60 * 60,
        message: "This network has filed too many reports in a short period. Try again later.",
      },
      content: {
        scope: "report",
        body: `${payload.reason}\n${payload.details ?? ""}`.trim(),
        maxLinks: 1,
        duplicateWindowSeconds: 15 * 60,
        duplicateMessage: "That report looks like a duplicate of one you already filed recently.",
      },
    });
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: currentUser.id,
        reason: payload.reason,
        details: payload.details ?? null,
        target_type: payload.targetType,
        target_id: payload.targetId,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ report: data }, { status: 201 });
  } catch (error) {
    return jsonErrorResponse(error, "Unable to file report.");
  }
}
