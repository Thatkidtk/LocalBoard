import { NextResponse } from "next/server";

import { requireModerator } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { jsonError, jsonErrorResponse, parseJson } from "@/lib/http";
import { enforceMutationGuard } from "@/lib/security/guards";
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
    await enforceMutationGuard({
      request,
      currentUser: moderator,
      actionLabel: "resolve reports",
      userLimit: {
        scope: "admin:reports:resolve:user",
        maxRequests: 120,
        windowSeconds: 60 * 60,
        message: "You are resolving reports too quickly. Try again shortly.",
      },
      ipLimit: {
        scope: "admin:reports:resolve:ip",
        maxRequests: 240,
        windowSeconds: 60 * 60,
        message: "This network is resolving reports too quickly. Try again shortly.",
      },
    });
    const supabase = await createSupabaseServerClient();
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("id, target_type, target_id, status")
      .eq("id", reportId)
      .maybeSingle();

    if (reportError) {
      throw reportError;
    }
    if (!report) {
      return jsonError("Report not found.", 404);
    }
    if (report.status !== "open") {
      return jsonError("Report has already been resolved.", 400);
    }

    if (payload.action === "remove_post" && report.target_type !== "post") {
      return jsonError("This report targets a comment, not a post.", 400);
    }

    if (payload.action === "remove_comment" && report.target_type !== "comment") {
      return jsonError("This report targets a post, not a comment.", 400);
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
      if (!authorId) {
        return jsonError("Target author not found.", 404);
      }

      const { error: suspendError } = await supabase
        .from("profiles")
        .update({ is_suspended: true })
        .eq("id", authorId);

      if (suspendError) {
        throw suspendError;
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
    return jsonErrorResponse(error, "Unable to resolve report.");
  }
}
