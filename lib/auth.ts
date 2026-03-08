import type { SupabaseClient, User } from "@supabase/supabase-js";

import { getAdminAllowlist, hasSupabaseEnv } from "@/lib/env";
import { HttpError } from "@/lib/http";
import { isMissingSchemaError } from "@/lib/supabase/errors";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
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

const PROFILE_SELECT =
  "id, username, avatar_path, karma, role, is_suspended, home_community_id, created_at, updated_at, home:communities!profiles_home_community_id_fkey(slug)";

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
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ProfileRecord | null;
}

async function loadProfileWithServiceRole(userId: string) {
  try {
    const serviceClient = createSupabaseServiceRoleClient();
    return await loadProfile(serviceClient, userId);
  } catch {
    return null;
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildFallbackProfile({
  user,
  username,
  role,
  communityId,
  communitySlug,
  existingProfile,
}: {
  user: User;
  username: string;
  role: UserRole;
  communityId: string | null;
  communitySlug: string | null;
  existingProfile?: ProfileRecord | null;
}): ProfileRecord {
  const timestamp = new Date().toISOString();

  return {
    id: user.id,
    username: existingProfile?.username ?? username,
    avatar_path: existingProfile?.avatar_path ?? null,
    karma: existingProfile?.karma ?? 0,
    role,
    is_suspended: existingProfile?.is_suspended ?? false,
    home_community_id: existingProfile?.home_community_id ?? communityId,
    created_at: existingProfile?.created_at ?? timestamp,
    updated_at: timestamp,
    home: existingProfile?.home ?? (communitySlug ? { slug: communitySlug } : null),
  };
}

async function loadBootstrapProfile(
  supabase: SupabaseClient,
  userId: string,
  retries = 3,
): Promise<ProfileRecord | null> {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const profile = await loadProfile(supabase, userId);
    if (profile) {
      return profile;
    }

    const serviceRoleProfile = await loadProfileWithServiceRole(userId);
    if (serviceRoleProfile) {
      return serviceRoleProfile;
    }

    if (attempt < retries - 1) {
      await wait(120 * (attempt + 1));
    }
  }

  return null;
}

async function ensureProfileRecord(
  supabase: SupabaseClient,
  user: User,
): Promise<ProfileRecord> {
  const metadata = user.user_metadata ?? {};
  let communityId: string | null = null;
  let communitySlug: string | null =
    typeof metadata.home_community_slug === "string" ? metadata.home_community_slug : null;
  const username =
    typeof metadata.username === "string" && metadata.username
      ? metadata.username
      : inferUsername(user);
  const role = desiredRole(user);
  let profile = await loadBootstrapProfile(supabase, user.id, 1);

  if (!profile) {
    if (typeof metadata.home_community_slug === "string" && metadata.home_community_slug) {
      const { data: community, error: communityError } = await supabase
        .from("communities")
        .select("id, slug")
        .eq("slug", metadata.home_community_slug)
        .maybeSingle();

      if (communityError) {
        throw communityError;
      }

      communityId = community?.id ?? null;
      communitySlug = community?.slug ?? communitySlug;
    }

    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      username,
      home_community_id: communityId,
      role,
    });

    if (insertError && insertError.code !== "23505") {
      throw insertError;
    }

    profile =
      (await loadBootstrapProfile(supabase, user.id)) ??
      buildFallbackProfile({
        user,
        username,
        role,
        communityId,
        communitySlug,
      });
  }

  if (!profile) {
    throw new Error("Profile bootstrap failed.");
  }

  communityId = profile.home_community_id ?? communityId;
  communitySlug = profile.home?.slug ?? communitySlug;

  const nextRole = role;
  if (profile.role !== nextRole && nextRole === "admin") {
    const { error } = await supabase
      .from("profiles")
      .update({ role: nextRole })
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    profile =
      (await loadBootstrapProfile(supabase, user.id, 2)) ??
      buildFallbackProfile({
        user,
        username: profile.username,
        role: nextRole,
        communityId,
        communitySlug,
        existingProfile: profile,
      });
  }

  if (!profile) {
    throw new Error("Profile reload failed.");
  }

  return profile;
}

function toCurrentUser(profile: ProfileRecord, user: User): CurrentUser {
  return {
    id: profile.id,
    email: user.email ?? "",
    isEmailVerified: Boolean(user.email_confirmed_at),
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
    if ("message" in error && error.message === "Auth session missing!") {
      return null;
    }
    throw error;
  }

  if (!user?.email) {
    return null;
  }

  try {
    const profile = await ensureProfileRecord(supabase, user);
    return toCurrentUser(profile, user);
  } catch (bootstrapError) {
    if (isMissingSchemaError(bootstrapError)) {
      return null;
    }

    throw bootstrapError;
  }
}

export async function requireCurrentUser(options?: { verified?: boolean }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new HttpError("Authentication required.", 401);
  }

  if (currentUser.isSuspended) {
    throw new HttpError("This account is suspended.", 403);
  }

  if (options?.verified && !currentUser.isEmailVerified) {
    throw new HttpError("Verify your email address before continuing.", 403);
  }

  return currentUser;
}

export async function requireModerator() {
  const currentUser = await requireCurrentUser({ verified: true });

  if (currentUser.role !== "moderator" && currentUser.role !== "admin") {
    throw new HttpError("Moderator access required.", 403);
  }

  return currentUser;
}
