import type { CurrentUser, NotificationItem } from "@/lib/types";
import { TopNav } from "@/components/layout/top-nav";

interface AppShellProps {
  children: React.ReactNode;
  currentUser: CurrentUser | null;
  notifications: NotificationItem[];
}

export function AppShell({ children, currentUser, notifications }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(51,102,255,0.11),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(18,191,158,0.14),_transparent_32%),var(--wash)]">
      <TopNav currentUser={currentUser} notifications={notifications} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
