import { redirect } from "next/navigation";

import { PostComposerForm } from "@/components/post/post-composer-form";
import { getCurrentUser } from "@/lib/auth";
import { getHomePageData } from "@/lib/data/queries";
import { hasSupabaseEnv } from "@/lib/env";

export default async function SubmitPage() {
  const [currentUser, homeData] = await Promise.all([getCurrentUser(), getHomePageData()]);

  if (!currentUser && hasSupabaseEnv()) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PostComposerForm communityId={homeData.activeCommunity.id} />
      <p className="text-sm leading-7 text-[var(--muted)]">
        Posts are scoped to your active community. You can switch communities from the feed and
        return here to post locally.
      </p>
    </div>
  );
}
