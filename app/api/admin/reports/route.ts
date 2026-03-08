import { NextResponse } from "next/server";

import { requireModerator } from "@/lib/auth";
import { getAdminReports } from "@/lib/data/queries";
import { hasSupabaseEnv } from "@/lib/env";
import { jsonError } from "@/lib/http";

export async function GET() {
  if (hasSupabaseEnv()) {
    try {
      await requireModerator();
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "Access denied.", 403);
    }
  }

  const reports = await getAdminReports();
  return NextResponse.json({ reports });
}
