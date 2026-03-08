"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { TurnstileWidget } from "@/components/auth/turnstile-widget";
import type { CommunitySummary } from "@/lib/types";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
  communities: CommunitySummary[];
}

export function AuthForm({ mode, communities }: AuthFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState(communities[0]?.slug ?? "");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetCounter, setCaptchaResetCounter] = useState(0);
  const submitLabel = mode === "sign-in" ? "Sign in" : "Create account";
  const captchaSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  const header = useMemo(() => {
    return mode === "sign-in"
      ? {
          title: "Welcome back",
          description: "Sign in to post, vote, and keep up with your block.",
        }
      : {
          title: "Claim your local board",
          description: "Pick where you live so LocalBoard can drop you into the right community feed.",
        };
  }, [mode]);

  return (
    <div className="mx-auto max-w-xl rounded-[2rem] border border-black/10 bg-white/85 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
          {mode === "sign-in" ? "Member access" : "New account"}
        </p>
        <h1 className="font-display text-4xl tracking-tight text-[var(--ink)]">{header.title}</h1>
        <p className="max-w-lg text-sm leading-7 text-[var(--muted)]">{header.description}</p>
      </div>

      <form
        className="mt-8 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const email = String(formData.get("email") ?? "");
          const password = String(formData.get("password") ?? "");
          const username = String(formData.get("username") ?? "");
          const communitySlug = String(formData.get("communitySlug") ?? "");

          startTransition(async () => {
            try {
              setMessage(null);

              const response = await fetch(
                mode === "sign-in" ? "/api/auth/sign-in" : "/api/auth/sign-up",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email,
                    password,
                    username,
                    communitySlug,
                    captchaToken,
                  }),
                },
              );

              const payload = (await response.json().catch(() => null)) as
                | {
                    error?: string;
                    redirectTo?: string | null;
                    requiresEmailVerification?: boolean;
                    message?: string | null;
                  }
                | null;

              if (!response.ok) {
                setMessage(payload?.error ?? "Unable to continue.");
                if (captchaSiteKey) {
                  setCaptchaResetCounter((value) => value + 1);
                }
                return;
              }

              if (payload?.requiresEmailVerification) {
                setMessage(payload.message ?? "Check your email to verify your account.");
                if (captchaSiteKey) {
                  setCaptchaResetCounter((value) => value + 1);
                }
                return;
              }

              router.push(payload?.redirectTo ?? "/");
              router.refresh();
            } catch {
              setMessage("Unable to continue.");
              if (captchaSiteKey) {
                setCaptchaResetCounter((value) => value + 1);
              }
            }
          });
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--ink)]">Email</span>
          <input
            required
            type="email"
            name="email"
            className="w-full rounded-2xl border border-black/10 bg-[var(--panel)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)]"
            placeholder="neighbor@example.com"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--ink)]">Password</span>
          <input
            required
            minLength={8}
            type="password"
            name="password"
            className="w-full rounded-2xl border border-black/10 bg-[var(--panel)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)]"
            placeholder="At least 8 characters"
          />
        </label>

        {mode === "sign-up" ? (
          <>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--ink)]">Username</span>
              <input
                required
                minLength={3}
                maxLength={24}
                name="username"
                className="w-full rounded-2xl border border-black/10 bg-[var(--panel)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)]"
                placeholder="blockwatch"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--ink)]">Home community</span>
              <select
                required
                name="communitySlug"
                value={selectedCommunity}
                onChange={(event) => setSelectedCommunity(event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[var(--panel)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)]"
              >
                {communities.map((community) => (
                  <option key={community.id} value={community.slug}>
                    {community.city}, {community.stateCode} ({community.zipCode})
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--ink)]">
            {message}
          </div>
        ) : null}

        {captchaSiteKey ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--muted)]">
              Anti-bot check
            </p>
            <TurnstileWidget
              siteKey={captchaSiteKey}
              resetSignal={captchaResetCounter}
              onTokenChange={setCaptchaToken}
            />
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending || Boolean(captchaSiteKey && !captchaToken)}
          className="w-full rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
        >
          {pending ? "Working..." : submitLabel}
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--muted)]">
        {mode === "sign-in" ? "New here?" : "Already have an account?"}{" "}
        <Link
          href={mode === "sign-in" ? "/auth/sign-up" : "/auth/sign-in"}
          className="font-semibold text-[var(--ink)] underline decoration-[var(--accent)] underline-offset-4"
        >
          {mode === "sign-in" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
