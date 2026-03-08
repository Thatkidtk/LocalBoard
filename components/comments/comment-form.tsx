"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface CommentFormProps {
  postId: string;
  parentCommentId?: string | null;
  compact?: boolean;
}

export function CommentForm({
  postId,
  parentCommentId = null,
  compact = false,
}: CommentFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const endpoint = parentCommentId
          ? `/api/comments/${parentCommentId}/reply`
          : `/api/posts/${postId}/comments`;

        startTransition(async () => {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              body,
              postId,
              parentCommentId,
            }),
          });

          if (response.ok) {
            setBody("");
            router.refresh();
          }
        });
      }}
    >
      <textarea
        required
        minLength={2}
        maxLength={2000}
        rows={compact ? 3 : 5}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={parentCommentId ? "Write a reply" : "Add context, sources, or updates"}
        className="w-full rounded-[1.5rem] border border-black/10 bg-[var(--panel)] px-4 py-3 text-sm leading-7 outline-none transition focus:border-[var(--accent)]"
      />
      <button
        type="submit"
        disabled={pending || !body.trim()}
        className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
      >
        {pending ? "Posting..." : parentCommentId ? "Reply" : "Add comment"}
      </button>
    </form>
  );
}
