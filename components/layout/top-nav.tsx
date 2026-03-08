import Link from "next/link";
import { MapPinned, Shield, UserRound } from "lucide-react";

import type { CurrentUser, NotificationItem } from "@/lib/types";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { SignOutButton } from "@/components/layout/sign-out-button";

interface TopNavProps {
  currentUser: CurrentUser | null;
  notifications: NotificationItem[];
}

export function TopNav({ currentUser, notifications }: TopNavProps) {
  const newPostHref = currentUser?.homeCommunitySlug
    ? `/submit?community=${currentUser.homeCommunitySlug}`
    : "/submit";

  return (
    <header className="sticky top-0 z-30 border-b border-black/8 bg-[color:var(--wash)]/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ink)] text-white shadow-lg">
              <MapPinned className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-xl tracking-tight text-[var(--ink)]">LocalBoard</p>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                Local updates, faster
              </p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-2 md:justify-end md:gap-3">
            <Link
              href={newPostHref}
              className="rounded-full bg-[var(--ink)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              New post
            </Link>
            {currentUser ? (
              <>
                <NotificationCenter notifications={notifications} />
                <Link
                  href={`/u/${currentUser.username}`}
                  className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-black/20 hover:bg-[var(--panel-strong)]"
                >
                  <span className="inline-flex items-center gap-2">
                    <UserRound className="h-4 w-4" />
                    {currentUser.username}
                  </span>
                </Link>
                <Link
                  href="/settings"
                  className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-black/20 hover:bg-[var(--panel-strong)]"
                >
                  Settings
                </Link>
                {currentUser.role !== "member" ? (
                  <Link
                    href="/admin"
                    className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-black/20 hover:bg-[var(--panel-strong)]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </span>
                  </Link>
                ) : null}
                <SignOutButton />
              </>
            ) : (
              <>
                <Link
                  href="/auth/sign-in"
                  className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-black/20 hover:bg-[var(--panel-strong)]"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Join your board
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
