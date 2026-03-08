import { redirect } from "next/navigation";

import { PostComposerForm } from "@/components/post/post-composer-form";
import { getCurrentUser } from "@/lib/auth";
import { getHomePageData, searchCommunities } from "@/lib/data/queries";
import { hasSupabaseEnv } from "@/lib/env";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ community?: string }>;
}) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();

  if (!currentUser && hasSupabaseEnv()) {
    redirect("/auth/sign-in");
  }

  const [homeData, communities] = await Promise.all([
    getHomePageData(params.community ?? currentUser?.homeCommunitySlug),
    searchCommunities(""),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PostComposerForm
        communities={communities}
        defaultCommunityId={homeData.activeCommunity.id}
      />
      <p className="text-sm leading-7 text-[var(--muted)]">
        Posts are scoped to your active community. You can switch communities from the feed and
        return here to post locally.
      </p>
    </div>
  );
}
