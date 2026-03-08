"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(async () => {
          const supabase = getSupabaseBrowserClient();
          await supabase.auth.signOut();
          router.push("/");
          router.refresh();
        });
      }}
      className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-black/20 hover:bg-[var(--panel-strong)]"
      disabled={pending}
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
