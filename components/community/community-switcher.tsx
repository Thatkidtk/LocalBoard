import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { CommunitySummary } from "@/lib/types";
import { formatDistanceMiles } from "@/lib/utils";

interface CommunitySwitcherProps {
  activeSlug: string;
  communities: CommunitySummary[];
}

export function CommunitySwitcher({
  activeSlug,
  communities,
}: CommunitySwitcherProps) {
  if (!communities.length) {
    return null;
  }

  return (
    <div className="rounded-[2rem] border border-black/10 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            Nearby boards
          </p>
          <h2 className="mt-2 font-display text-2xl text-[var(--ink)]">Switch communities</h2>
        </div>
      </div>

      <div className="space-y-3">
        {communities.map((community) => {
          const isActive = community.slug === activeSlug;
          return (
            <Link
              key={community.id}
              href={`/c/${community.slug}`}
              className={`flex items-center justify-between rounded-2xl border px-4 py-4 transition ${
                isActive
                  ? "border-[var(--accent)]/30 bg-[var(--accent-soft)]"
                  : "border-black/10 bg-[var(--panel)] hover:border-black/20 hover:bg-[var(--panel-strong)]"
              }`}
            >
              <div>
                <p className="font-medium text-[var(--ink)]">
                  {community.city}, {community.stateCode}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  {community.zipCode}
                  {community.distanceMiles ? ` · ${formatDistanceMiles(community.distanceMiles)}` : ""}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--muted)]" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
