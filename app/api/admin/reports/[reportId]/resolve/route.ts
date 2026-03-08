import { NextResponse } from "next/server";

import { requireModerator } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { parseJson, jsonError } from "@/lib/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reportResolutionSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ reportId: string }> },
) {
  if (!hasSupabaseEnv()) {
    return jsonError("Supabase is not configured for moderation in this environment.", 503);
  }

  try {
    const moderator = await requireModerator();
    const { reportId } = await context.params;
    const payload = await parseJson(request, reportResolutionSchema);
    const supabase = await createSupabaseServerClient();
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("id, target_type, target_id")
      .eq("id", reportId)
      .maybeSingle();

    if (reportError) {
      throw reportError;
    }
    if (!report) {
      return jsonError("Report not found.", 404);
    }

    if (payload.action === "remove_post" && report.target_type === "post") {
      const { error } = await supabase
        .from("posts")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: moderator.id,
        })
        .eq("id", report.target_id);

      if (error) {
        throw error;
      }
    }

    if (payload.action === "remove_comment" && report.target_type === "comment") {
      const { error } = await supabase
        .from("comments")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: moderator.id,
        })
        .eq("id", report.target_id);

      if (error) {
        throw error;
      }
    }

    if (payload.action === "suspend_author") {
      const table = report.target_type === "post" ? "posts" : "comments";
      const { data: target, error } = await supabase
        .from(table)
        .select("author_id")
        .eq("id", report.target_id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      const authorId = target?.author_id;
      if (authorId) {
        const { error: suspendError } = await supabase
          .from("profiles")
          .update({ is_suspended: true })
          .eq("id", authorId);

        if (suspendError) {
          throw suspendError;
        }
      }
    }

    const nextStatus = payload.action === "dismiss" ? "dismissed" : "actioned";
    const { error: reportUpdateError } = await supabase
      .from("reports")
      .update({
        status: nextStatus,
        reviewer_id: moderator.id,
      })
      .eq("id", reportId);

    if (reportUpdateError) {
      throw reportUpdateError;
    }

    const { error: moderationError } = await supabase.from("moderation_actions").insert({
      moderator_id: moderator.id,
      report_id: reportId,
      action: payload.action,
      note: payload.note ?? null,
      target_id: report.target_id,
      target_type: report.target_type,
    });

    if (moderationError) {
      throw moderationError;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to resolve report.", 400);
  }
}
