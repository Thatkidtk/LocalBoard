import Link from "next/link";

import { LocationPicker } from "@/components/community/location-picker";
import { PostCard } from "@/components/post/post-card";
import { getCurrentUser } from "@/lib/auth";
import { getHomePageData } from "@/lib/data/queries";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ community?: string }>;
}) {
  const params = await searchParams;
  const [homeData, currentUser] = await Promise.all([
    getHomePageData(params.community),
    getCurrentUser(),
  ]);

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2.5rem] border border-black/10 bg-white/80 p-8 shadow-[0_32px_120px_rgba(15,23,42,0.12)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--muted)]">
            LocalBoard
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-5xl tracking-tight text-[var(--ink)] sm:text-6xl">
            Every neighborhood needs a live pulse.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Drop into your ZIP-based community board to ask questions, flag alerts, and track
            the stories moving across your block right now.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/c/${homeData.activeCommunity.slug}`}
              className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Explore {homeData.activeCommunity.city}
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-black/20 hover:bg-[var(--panel-strong)]"
            >
              Create account
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-black/10 bg-[var(--ink)] p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              Active community
            </p>
            <h2 className="mt-3 font-display text-3xl">
              {homeData.activeCommunity.city}, {homeData.activeCommunity.stateCode}
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/72">
              {homeData.activeCommunity.description}
            </p>
            <Link
              href={`/c/${homeData.activeCommunity.slug}`}
              className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)]"
            >
              Open board
            </Link>
          </div>

          <LocationPicker initialCommunities={homeData.featuredCommunities} />
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
                Trending now
              </p>
              <h2 className="mt-3 font-display text-3xl text-[var(--ink)]">
                What neighbors are talking about
              </h2>
            </div>
            <Link
              href={`/c/${homeData.activeCommunity.slug}`}
              className="text-sm font-semibold text-[var(--ink)] underline decoration-[var(--accent)] underline-offset-4"
            >
              View full board
            </Link>
          </div>
          {homeData.trendingPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isAuthenticated={Boolean(currentUser)}
            />
          ))}
        </div>

        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-black/10 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
              Nearby boards
            </p>
            <div className="mt-4 space-y-3">
              {homeData.nearbyCommunities.map((community) => (
                <Link
                  key={community.id}
                  href={`/c/${community.slug}`}
                  className="block rounded-2xl border border-black/10 bg-[var(--panel)] px-4 py-4 transition hover:border-black/20 hover:bg-[var(--panel-strong)]"
                >
                  <p className="font-medium text-[var(--ink)]">
                    {community.city}, {community.stateCode}
                  </p>
                  <p className="text-sm text-[var(--muted)]">{community.zipCode}</p>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
