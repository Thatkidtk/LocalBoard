import Link from "next/link";
import { notFound } from "next/navigation";

import { CommunitySwitcher } from "@/components/community/community-switcher";
import { EmptyState } from "@/components/shared/empty-state";
import { PostCard } from "@/components/post/post-card";
import { PostSortTabs } from "@/components/post/post-sort-tabs";
import { getCurrentUser } from "@/lib/auth";
import { getCommunityPageData } from "@/lib/data/queries";

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const sort =
    query.sort === "new" || query.sort === "top" || query.sort === "hot" ? query.sort : "hot";
  const searchQuery = query.q?.trim() ?? "";

  const [pageData, currentUser] = await Promise.all([
    getCommunityPageData(slug, sort, searchQuery),
    getCurrentUser(),
  ]);

  if (!pageData) {
    notFound();
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_24rem]">
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-black/10 bg-white/80 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            Community board
          </p>
          <h1 className="mt-4 font-display text-5xl tracking-tight text-[var(--ink)]">
            {pageData.community.city}, {pageData.community.stateCode}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            {pageData.community.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <PostSortTabs
              activeSort={pageData.sort}
              pathname={`/c/${pageData.community.slug}`}
              searchQuery={pageData.searchQuery}
            />

            <form className="flex-1 min-w-[16rem]" action={`/c/${pageData.community.slug}`}>
              <input type="hidden" name="sort" value={pageData.sort} />
              <input
                type="search"
                name="q"
                defaultValue={pageData.searchQuery}
                placeholder="Search posts in this community"
                className="w-full rounded-full border border-black/10 bg-[var(--panel)] px-5 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
              />
            </form>
          </div>
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
            title="No posts matched that search."
            description="Try a different term, switch to a nearby community, or be the first person to start the conversation."
            action={
              <Link
                href={`/submit?community=${pageData.community.slug}`}
                className="inline-flex rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
              >
                Create a post
              </Link>
            }
          />
        )}
      </section>

      <aside className="space-y-6">
        <CommunitySwitcher
          activeSlug={pageData.community.slug}
          communities={pageData.nearbyCommunities}
        />

        <div className="rounded-[2rem] border border-black/10 bg-[var(--ink)] p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            Join the conversation
          </p>
          <p className="mt-4 text-sm leading-7 text-white/75">
            Ask what changed, share verified updates, and help neighbors sort signal from noise.
          </p>
          <Link
            href={currentUser ? `/submit?community=${pageData.community.slug}` : "/auth/sign-up"}
            className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)]"
          >
            {currentUser ? "Start a post" : "Create account"}
          </Link>
        </div>
      </aside>
    </div>
  );
}
