import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentForm } from "@/components/comments/comment-form";
import { CommentThread } from "@/components/comments/comment-thread";
import { EmptyState } from "@/components/shared/empty-state";
import { PostCard } from "@/components/post/post-card";
import { getCurrentUser } from "@/lib/auth";
import { getPostDetail } from "@/lib/data/queries";

export default async function PostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const [post, currentUser] = await Promise.all([getPostDetail(postId), getCurrentUser()]);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PostCard post={post} isAuthenticated={Boolean(currentUser)} detail />

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
              Thread
            </p>
            <h2 className="mt-3 font-display text-3xl text-[var(--ink)]">Community replies</h2>
          </div>
        </div>

        <div className="rounded-[2rem] border border-black/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          {currentUser ? (
            <CommentForm postId={post.id} />
          ) : (
            <div className="rounded-[1.5rem] border border-black/10 bg-[var(--panel)] px-5 py-4 text-sm text-[var(--muted)]">
              <Link
                href="/auth/sign-in"
                className="font-semibold text-[var(--ink)] underline decoration-[var(--accent)] underline-offset-4"
              >
                Sign in
              </Link>{" "}
              to add context, reply to neighbors, or upvote the most helpful answers.
            </div>
          )}
        </div>

        {post.comments.length ? (
          <CommentThread comments={post.comments} isAuthenticated={Boolean(currentUser)} />
        ) : (
          <EmptyState
            title="No replies yet."
            description="Be the first neighbor to add context or verify what happened."
          />
        )}
      </section>
    </div>
  );
}
