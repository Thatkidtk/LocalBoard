import Link from "next/link";

import { FEED_SORTS, SORT_LABELS } from "@/lib/constants";
import type { SortMode } from "@/lib/types";

interface PostSortTabsProps {
  activeSort: SortMode;
  pathname: string;
  searchQuery?: string;
}

export function PostSortTabs({
  activeSort,
  pathname,
  searchQuery,
}: PostSortTabsProps) {
  return (
    <div className="inline-flex rounded-full border border-black/10 bg-white/80 p-1 shadow-sm">
      {FEED_SORTS.map((sort) => {
        const href = `${pathname}?sort=${sort}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`;
        const isActive = sort === activeSort;

        return (
          <Link
            key={sort}
            href={href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-[var(--ink)] text-white"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            {SORT_LABELS[sort]}
          </Link>
        );
      })}
    </div>
  );
}
