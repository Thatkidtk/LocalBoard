"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { ReportQueueItem } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

interface ReportQueueProps {
  reports: ReportQueueItem[];
}

const actionLabels = {
  dismiss: "Dismiss",
  remove_post: "Remove post",
  remove_comment: "Remove comment",
  suspend_author: "Suspend author",
} as const;

export function ReportQueue({ reports }: ReportQueueProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const resolveReport = (reportId: string, action: keyof typeof actionLabels) => {
    startTransition(async () => {
      const response = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <article
          key={report.id}
          className="rounded-[2rem] border border-black/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[var(--highlight-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink)]">
                  {report.targetType}
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  {report.status}
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  {formatRelativeTime(report.createdAt)}
                </span>
              </div>
              <h3 className="font-display text-2xl text-[var(--ink)]">{report.reason}</h3>
              <p className="text-sm leading-7 text-[var(--muted)]">{report.details ?? report.targetPreview}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Reporter: {report.reporter.username}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(actionLabels) as Array<keyof typeof actionLabels>).map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled={pending}
                  onClick={() => resolveReport(report.id, action)}
                  className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-black/20 hover:bg-[var(--panel-strong)]"
                >
                  {actionLabels[action]}
                </button>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
