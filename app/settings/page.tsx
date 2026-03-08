import { redirect } from "next/navigation";

import { ProfileSettingsForm } from "@/components/auth/profile-settings-form";
import { getCurrentUser } from "@/lib/auth";
import { getSettingsPageData } from "@/lib/data/queries";
import { hasSupabaseEnv } from "@/lib/env";

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser && hasSupabaseEnv()) {
    redirect("/auth/sign-in");
  }

  const settingsData = await getSettingsPageData();
  if (!settingsData) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <ProfileSettingsForm user={settingsData.user} communities={settingsData.communities} />
    </div>
  );
}
