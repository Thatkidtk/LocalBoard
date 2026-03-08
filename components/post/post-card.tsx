import Link from "next/link";
import { MessageCircleMore } from "lucide-react";

import { CATEGORY_LABELS } from "@/lib/constants";
import type { PostListItem } from "@/lib/types";
import { createExcerpt, formatRelativeTime } from "@/lib/utils";
import { VoteControls } from "@/components/post/vote-controls";
import { Avatar } from "@/components/shared/avatar";
import { ReportButton } from "@/components/post/report-button";

interface PostCardProps {
  post: PostListItem;
  isAuthenticated: boolean;
  detail?: boolean;
}

export function PostCard({ post, isAuthenticated, detail = false }: PostCardProps) {
  return (
    <article className="rounded-[2rem] border border-black/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex gap-5">
        <VoteControls
          endpoint={`/api/posts/${post.id}/vote`}
          initialScore={post.score}
          initialVote={post.userVote}
          isAuthenticated={isAuthenticated}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink)]">
              {CATEGORY_LABELS[post.category]}
            </span>
            <Link
              href={`/c/${post.community.slug}`}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)] hover:text-[var(--ink)]"
            >
              {post.community.city}, {post.community.stateCode}
            </Link>
          </div>

          <Link href={`/p/${post.id}`} className="mt-4 block">
            <h2 className="font-display text-2xl leading-tight tracking-tight text-[var(--ink)] sm:text-3xl">
              {post.title}
            </h2>
          </Link>

          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            {detail ? post.body : createExcerpt(post.body)}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={post.author.username} src={post.author.avatarUrl} className="h-9 w-9" />
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">{post.author.username}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  {formatRelativeTime(post.createdAt)}
                </p>
              </div>
            </div>

            <Link
              href={`/p/${post.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:border-black/20 hover:text-[var(--ink)]"
            >
              <MessageCircleMore className="h-4 w-4" />
              {post.commentCount} comments
            </Link>
          </div>

          {detail ? (
            <div className="mt-5">
              <ReportButton
                targetId={post.id}
                targetType="post"
                isAuthenticated={isAuthenticated}
              />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
