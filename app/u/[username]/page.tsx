import { notFound } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { PostCard } from "@/components/post/post-card";
import { CommentThread } from "@/components/comments/comment-thread";
import { Avatar } from "@/components/shared/avatar";
import { getCurrentUser } from "@/lib/auth";
import { getProfilePageData } from "@/lib/data/queries";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const [pageData, currentUser] = await Promise.all([
    getProfilePageData(username),
    getCurrentUser(),
  ]);

  if (!pageData) {
    notFound();
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[22rem_1fr]">
      <aside className="space-y-5">
        <div className="rounded-[2rem] border border-black/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <Avatar name={pageData.profile.username} src={pageData.profile.avatarUrl} className="h-16 w-16" />
          <h1 className="mt-5 font-display text-3xl text-[var(--ink)]">{pageData.profile.username}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Karma {pageData.profile.karma}
            {pageData.profile.homeCommunity
              ? ` · ${pageData.profile.homeCommunity.city}, ${pageData.profile.homeCommunity.stateCode}`
              : ""}
          </p>
        </div>
      </aside>

      <section className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            Recent activity
          </p>
          <h2 className="mt-3 font-display text-3xl text-[var(--ink)]">Posts</h2>
        </div>

        {pageData.posts.length ? (
          pageData.posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isAuthenticated={Boolean(currentUser)}
            />
          ))
        ) : (
          <EmptyState
            title="No posts yet."
            description="This member has not started a thread yet."
          />
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            Replies
          </p>
          <h2 className="mt-3 font-display text-3xl text-[var(--ink)]">Comments</h2>
        </div>

        {pageData.comments.length ? (
          <CommentThread comments={pageData.comments} isAuthenticated={Boolean(currentUser)} />
        ) : (
          <EmptyState
            title="No comments yet."
            description="Replies from this member will show up here."
          />
        )}
      </section>
    </div>
  );
}
