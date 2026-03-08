"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";

import type { ReportTargetType } from "@/lib/types";

interface ReportButtonProps {
  targetId: string;
  targetType: ReportTargetType;
  isAuthenticated: boolean;
}

export function ReportButton({
  targetId,
  targetType,
  isAuthenticated,
}: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:border-black/20 hover:text-[var(--ink)]"
      >
        <Flag className="h-4 w-4" />
        Report
      </button>

      {open ? (
        <form
          className="space-y-3 rounded-2xl border border-black/10 bg-[var(--panel)] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);

            startTransition(async () => {
              const response = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  targetId,
                  targetType,
                  reason: String(formData.get("reason") ?? ""),
                  details: String(formData.get("details") ?? ""),
                }),
              });

              setMessage(response.ok ? "Thanks. A moderator will review this." : "Unable to submit report.");
              if (response.ok) {
                setOpen(false);
              }
            });
          }}
        >
          <input
            required
            name="reason"
            placeholder="Short reason"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
          />
          <textarea
            name="details"
            rows={3}
            placeholder="Optional details"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
          >
            {pending ? "Sending..." : "Send report"}
          </button>
        </form>
      ) : null}

      {message ? <p className="text-xs text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
