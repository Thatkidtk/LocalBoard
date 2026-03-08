"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";

import type { CommunitySummary } from "@/lib/types";

interface LocationPickerProps {
  initialCommunities: CommunitySummary[];
}

export function LocationPicker({ initialCommunities }: LocationPickerProps) {
  const [query, setQuery] = useState("");
  const [remoteCommunities, setRemoteCommunities] = useState(initialCommunities);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!query.trim()) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      startTransition(async () => {
        const response = await fetch(`/api/communities/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });

        if (response.ok) {
          const payload = (await response.json()) as { communities: CommunitySummary[] };
          setRemoteCommunities(payload.communities);
        }
      });
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [initialCommunities, query]);

  const communities = query.trim() ? remoteCommunities : initialCommunities;

  return (
    <div className="rounded-[2rem] border border-black/10 bg-white/85 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-[var(--panel)] px-4 py-3">
        <Search className="h-4 w-4 text-[var(--muted)]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by city, ZIP, or neighborhood name"
          className="w-full bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
        />
        {pending ? <span className="text-xs text-[var(--muted)]">Searching...</span> : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {communities.map((community) => (
          <Link
            key={community.id}
            href={`/c/${community.slug}`}
            className="rounded-2xl border border-black/10 bg-[var(--panel)] px-4 py-4 transition hover:-translate-y-0.5 hover:border-black/20 hover:bg-[var(--panel-strong)]"
          >
            <p className="font-display text-lg text-[var(--ink)]">{community.city}</p>
            <p className="text-sm text-[var(--muted)]">
              {community.stateCode} · {community.zipCode}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
