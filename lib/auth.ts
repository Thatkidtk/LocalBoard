import type { SupabaseClient, User } from "@supabase/supabase-js";

import { getAdminAllowlist, hasSupabaseEnv } from "@/lib/env";
import type { CurrentUser, UserRole } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProfileRecord = {
  id: string;
  username: string;
  avatar_path: string | null;
  karma: number;
  role: string;
  is_suspended: boolean;
  home_community_id: string | null;
  created_at: string;
  updated_at: string;
  home?: { slug: string | null } | null;
};

function inferUsername(user: User) {
  const emailName = user.email?.split("@")[0] ?? `neighbor_${user.id.slice(0, 6)}`;
  return emailName.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 24) || `neighbor_${user.id.slice(0, 6)}`;
}

function desiredRole(user: User): UserRole {
  const allowlist = getAdminAllowlist();

  if (user.email && allowlist.includes(user.email.toLowerCase())) {
    return "admin";
  }

  return "member";
}

async function loadProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileRecord | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, avatar_path, karma, role, is_suspended, home_community_id, created_at, updated_at, home:communities!profiles_home_community_id_fkey(slug)",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ProfileRecord | null;
}

async function ensureProfileRecord(
  supabase: SupabaseClient,
  user: User,
): Promise<ProfileRecord> {
  let profile = await loadProfile(supabase, user.id);

  if (!profile) {
    const metadata = user.user_metadata ?? {};
    let communityId: string | null = null;

    if (typeof metadata.home_community_slug === "string" && metadata.home_community_slug) {
      const { data: community } = await supabase
        .from("communities")
        .select("id")
        .eq("slug", metadata.home_community_slug)
        .maybeSingle();

      communityId = community?.id ?? null;
    }

    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      username:
        typeof metadata.username === "string" && metadata.username
          ? metadata.username
          : inferUsername(user),
      home_community_id: communityId,
      role: desiredRole(user),
    });

    if (insertError) {
      throw insertError;
    }

    profile = await loadProfile(supabase, user.id);
  }

  if (!profile) {
    throw new Error("Profile bootstrap failed.");
  }

  const nextRole = desiredRole(user);
  if (profile.role !== nextRole && nextRole === "admin") {
    const { error } = await supabase
      .from("profiles")
      .update({ role: nextRole })
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    profile = await loadProfile(supabase, user.id);
  }

  if (!profile) {
    throw new Error("Profile reload failed.");
  }

  return profile;
}

function toCurrentUser(profile: ProfileRecord, email: string): CurrentUser {
  return {
    id: profile.id,
    email,
    username: profile.username,
    avatarUrl: profile.avatar_path,
    karma: profile.karma,
    role: profile.role as UserRole,
    homeCommunityId: profile.home_community_id,
    homeCommunitySlug: profile.home?.slug ?? null,
    isSuspended: profile.is_suspended,
  };
}

export async function getCurrentUser() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user?.email) {
    return null;
  }

  const profile = await ensureProfileRecord(supabase, user);
  return toCurrentUser(profile, user.email);
}

export async function requireCurrentUser() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Authentication required.");
  }

  if (currentUser.isSuspended) {
    throw new Error("This account is suspended.");
  }

  return currentUser;
}

export async function requireModerator() {
  const currentUser = await requireCurrentUser();

  if (currentUser.role !== "moderator" && currentUser.role !== "admin") {
    throw new Error("Moderator access required.");
  }

  return currentUser;
}
