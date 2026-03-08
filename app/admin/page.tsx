import { redirect } from "next/navigation";

import { ReportQueue } from "@/components/admin/report-queue";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser, requireModerator } from "@/lib/auth";
import { getAdminReports } from "@/lib/data/queries";
import { hasSupabaseEnv } from "@/lib/env";

export default async function AdminPage() {
  if (hasSupabaseEnv()) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      redirect("/auth/sign-in");
    }
    await requireModerator();
  }

  const reports = await getAdminReports();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
          Moderation
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-[var(--ink)]">Report queue</h1>
      </div>

      {reports.length ? (
        <ReportQueue reports={reports} />
      ) : (
        <EmptyState
          title="Nothing in the queue."
          description="Reports, spam reviews, and moderation actions will show up here."
        />
      )}
    </div>
  );
}
