"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Bell } from "lucide-react";

import type { NotificationItem } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

interface NotificationCenterProps {
  notifications: NotificationItem[];
  disabled?: boolean;
}

export function NotificationCenter({
  notifications,
  disabled = false,
}: NotificationCenterProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const unreadIds = useMemo(() => {
    return notifications.filter((notification) => !notification.readAt).map((notification) => notification.id);
  }, [notifications]);

  const markAllRead = () => {
    if (!unreadIds.length || disabled) {
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: unreadIds }),
      });

      if (response.ok) {
        router.refresh();
      }
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const nextState = !isOpen;
          setIsOpen(nextState);
          if (nextState) {
            markAllRead();
          }
        }}
        className="relative rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-black/20 hover:bg-[var(--panel-strong)]"
      >
        <span className="inline-flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Alerts
        </span>
        {unreadIds.length > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-white">
            {unreadIds.length}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-20 mt-3 w-[22rem] rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg text-[var(--ink)]">Notifications</h3>
            {pending ? <span className="text-xs text-[var(--muted)]">Updating...</span> : null}
          </div>
          <div className="space-y-3">
            {notifications.length ? (
              notifications.map((notification) => {
                const href = notification.postId ? `/p/${notification.postId}` : "/";
                return (
                  <Link
                    key={notification.id}
                    href={href}
                    className="block rounded-2xl border border-black/5 bg-[var(--panel)] px-4 py-3 transition hover:border-black/10 hover:bg-[var(--panel-strong)]"
                    onClick={() => setIsOpen(false)}
                  >
                    <p className="text-sm font-medium text-[var(--ink)]">{notification.message}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </Link>
                );
              })
            ) : (
              <p className="rounded-2xl bg-[var(--panel)] px-4 py-6 text-sm text-[var(--muted)]">
                You are caught up.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
