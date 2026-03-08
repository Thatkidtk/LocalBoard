"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { CATEGORY_LABELS, POST_CATEGORIES } from "@/lib/constants";
import type { PostCategory } from "@/lib/types";

interface PostComposerFormProps {
  communityId: string;
}

export function PostComposerForm({ communityId }: PostComposerFormProps) {
  const router = useRouter();
  const [category, setCategory] = useState<PostCategory>("question");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-5 rounded-[2rem] border border-black/10 bg-white/85 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          setError(null);
          const response = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: String(formData.get("title") ?? ""),
              body: String(formData.get("body") ?? ""),
              category,
              communityId,
            }),
          });

          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            setError(payload?.error ?? "Unable to publish post.");
            return;
          }

          const payload = (await response.json()) as { post: { id: string } };
          router.push(`/p/${payload.post.id}`);
          router.refresh();
        });
      }}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
          Start a thread
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-[var(--ink)]">What is happening nearby?</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {POST_CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              item === category
                ? "bg-[var(--ink)] text-white"
                : "border border-black/10 bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            {CATEGORY_LABELS[item]}
          </button>
        ))}
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--ink)]">Title</span>
        <input
          required
          minLength={6}
          maxLength={120}
          name="title"
          className="w-full rounded-2xl border border-black/10 bg-[var(--panel)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
          placeholder="Ask a question or share an update"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--ink)]">Body</span>
        <textarea
          required
          minLength={20}
          maxLength={5000}
          rows={10}
          name="body"
          className="w-full rounded-[1.5rem] border border-black/10 bg-[var(--panel)] px-4 py-4 text-sm leading-7 outline-none transition focus:border-[var(--accent)]"
          placeholder="Add the details neighbors need to know."
        />
      </label>

      {error ? (
        <div className="rounded-2xl border border-[var(--highlight)]/30 bg-[var(--highlight-soft)] px-4 py-3 text-sm text-[var(--ink)]">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
      >
        {pending ? "Publishing..." : "Publish post"}
      </button>
    </form>
  );
}
