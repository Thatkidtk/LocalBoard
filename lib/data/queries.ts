import { buildCommentTree } from "@/lib/comments";
import { getCurrentUser } from "@/lib/auth";
import { buildTsQuery, normalizeSearchQuery } from "@/lib/search";
import { hasSupabaseEnv } from "@/lib/env";
import { isMissingSchemaError } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AuthorSummary,
  CommentNode,
  CommunityPageData,
  CommunitySummary,
  HomePageData,
  NotificationItem,
  PostDetail,
  PostListItem,
  ProfilePageData,
  ReportQueueItem,
  SettingsPageData,
  SortMode,
  VoteValue,
} from "@/lib/types";
import {
  getMockCommunityPageData,
  getMockHomePageData,
  getMockNotifications,
  getMockPostDetail,
  getMockProfilePageData,
  getMockReports,
  getMockSettingsData,
  searchMockCommunities,
} from "@/lib/data/mock";

function mapCommunity(row: Record<string, unknown>): CommunitySummary {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    zipCode: String(row.zip_code),
    city: String(row.city),
    stateCode: String(row.state_code),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    description: typeof row.description === "string" ? row.description : undefined,
  };
}

function mapAuthor(row: Record<string, unknown> | null | undefined): AuthorSummary {
  return {
    id: String(row?.id ?? "unknown"),
    username: String(row?.username ?? "neighbor"),
    avatarUrl: typeof row?.avatar_path === "string" ? row.avatar_path : null,
    karma: Number(row?.karma ?? 0),
    role: (row?.role as AuthorSummary["role"]) ?? "member",
    isSuspended: Boolean(row?.is_suspended ?? false),
  };
}

function mapPost(row: Record<string, unknown>, userVote: VoteValue = 0): PostListItem {
  return {
    id: String(row.id),
    title: String(row.title),
    body: String(row.body),
    category: row.category as PostListItem["category"],
    score: Number(row.score ?? 0),
    commentCount: Number(row.comment_count ?? 0),
    hotScore: Number(row.hot_score ?? 0),
    createdAt: String(row.created_at),
    userVote,
    community: mapCommunity(row.community as Record<string, unknown>),
    author: mapAuthor(row.author as Record<string, unknown>),
    isDeleted: Boolean(row.deleted_at),
  };
}

function mapComment(row: Record<string, unknown>, userVote: VoteValue = 0): CommentNode {
  return {
    id: String(row.id),
    postId: String(row.post_id),
    parentCommentId:
      typeof row.parent_comment_id === "string" ? row.parent_comment_id : null,
    body: String(row.body),
    createdAt: String(row.created_at),
    score: Number(row.score ?? 0),
    userVote,
    depth: Number(row.depth ?? 0),
    renderDepth: Number(row.depth ?? 0),
    isDeleted: Boolean(row.deleted_at),
    author: mapAuthor(row.author as Record<string, unknown>),
    replies: [],
  };
}

async function getNearbyCommunities(communityId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("community_neighbors")
    .select(
      "distance_miles, nearby:communities!community_neighbors_nearby_community_id_fkey(id, slug, name, zip_code, city, state_code, latitude, longitude, description)",
    )
    .eq("community_id", communityId)
    .order("distance_miles", { ascending: true })
    .limit(6);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    ...mapCommunity(row.nearby as unknown as Record<string, unknown>),
    distanceMiles: Number(row.distance_miles),
  }));
}

async function getPostVoteMap(
  userId: string | null | undefined,
  postIds: string[],
): Promise<Map<string, VoteValue>> {
  if (!userId || !postIds.length) {
    return new Map();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("post_votes")
    .select("post_id, value")
    .eq("user_id", userId)
    .in("post_id", postIds);

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map((row) => [String(row.post_id), Number(row.value) as VoteValue]),
  );
}

async function getCommentVoteMap(
  userId: string | null | undefined,
  commentIds: string[],
): Promise<Map<string, VoteValue>> {
  if (!userId || !commentIds.length) {
    return new Map();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("comment_votes")
    .select("comment_id, value")
    .eq("user_id", userId)
    .in("comment_id", commentIds);

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map((row) => [String(row.comment_id), Number(row.value) as VoteValue]),
  );
}

export async function getHomePageData(selectedCommunitySlug?: string | null): Promise<HomePageData> {
  if (!hasSupabaseEnv()) {
    return getMockHomePageData(selectedCommunitySlug);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const currentUser = await getCurrentUser();
    let communityQuery = supabase.from("communities").select("*").limit(1);

    if (selectedCommunitySlug) {
      communityQuery = supabase
        .from("communities")
        .select("*")
        .eq("slug", selectedCommunitySlug)
        .limit(1);
    } else if (currentUser?.homeCommunityId) {
      communityQuery = supabase
        .from("communities")
        .select("*")
        .eq("id", currentUser.homeCommunityId)
        .limit(1);
    }

    const { data: communityRows, error: communityError } = await communityQuery;
    if (communityError) {
      throw communityError;
    }

    const communityRow = communityRows?.[0];
    if (!communityRow) {
      return getMockHomePageData();
    }

    const activeCommunity = mapCommunity(communityRow as unknown as Record<string, unknown>);
    const [featuredResult, postsResult, nearbyCommunities] = await Promise.all([
      supabase.from("communities").select("*").order("city").limit(6),
      supabase
        .from("posts")
        .select(
          "id, title, body, category, score, comment_count, hot_score, created_at, deleted_at, community:communities(id, slug, name, zip_code, city, state_code, latitude, longitude, description), author:profiles!posts_author_id_fkey(id, username, avatar_path, karma, role, is_suspended)",
        )
        .eq("community_id", activeCommunity.id)
        .is("deleted_at", null)
        .order("hot_score", { ascending: false })
        .limit(20),
      getNearbyCommunities(activeCommunity.id),
    ]);

    if (featuredResult.error) {
      throw featuredResult.error;
    }
    if (postsResult.error) {
      throw postsResult.error;
    }

    const postVoteMap = await getPostVoteMap(
      currentUser?.id,
      (postsResult.data ?? []).map((row) => String(row.id)),
    );

    return {
      activeCommunity,
      featuredCommunities: (featuredResult.data ?? []).map((row) =>
        mapCommunity(row as unknown as Record<string, unknown>),
      ),
      nearbyCommunities,
      trendingPosts: (postsResult.data ?? []).map((row) =>
        mapPost(
          row as unknown as Record<string, unknown>,
          postVoteMap.get(String(row.id)) ?? 0,
        ),
      ),
    };
  } catch (error) {
    if (isMissingSchemaError(error)) {
      return getMockHomePageData(selectedCommunitySlug);
    }

    throw error;
  }
}

export async function getCommunityPageData(
  slug: string,
  sort: SortMode,
  searchQuery: string,
): Promise<CommunityPageData | null> {
  if (!hasSupabaseEnv()) {
    return getMockCommunityPageData(slug, sort, searchQuery);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const currentUser = await getCurrentUser();
    const { data: communityRow, error: communityError } = await supabase
      .from("communities")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (communityError) {
      throw communityError;
    }
    if (!communityRow) {
      return null;
    }

    let postsQuery = supabase
      .from("posts")
      .select(
        "id, title, body, category, score, comment_count, hot_score, created_at, deleted_at, community:communities(id, slug, name, zip_code, city, state_code, latitude, longitude, description), author:profiles!posts_author_id_fkey(id, username, avatar_path, karma, role, is_suspended)",
      )
      .eq("community_id", communityRow.id)
      .is("deleted_at", null)
      .limit(50);

    const normalizedSearch = normalizeSearchQuery(searchQuery);
    if (normalizedSearch) {
      postsQuery = postsQuery.textSearch("search_document", buildTsQuery(normalizedSearch), {
        config: "english",
      });
    }

    const orderBy =
      sort === "new"
        ? { column: "created_at", ascending: false }
        : sort === "top"
          ? { column: "score", ascending: false }
          : { column: "hot_score", ascending: false };

    const [{ data: postsRows, error: postsError }, nearbyCommunities] = await Promise.all([
      postsQuery.order(orderBy.column, { ascending: orderBy.ascending }),
      getNearbyCommunities(communityRow.id),
    ]);

    if (postsError) {
      throw postsError;
    }

    const postVoteMap = await getPostVoteMap(
      currentUser?.id,
      (postsRows ?? []).map((row) => String(row.id)),
    );

    return {
      community: mapCommunity(communityRow as unknown as Record<string, unknown>),
      nearbyCommunities,
      posts: (postsRows ?? []).map((row) =>
        mapPost(
          row as unknown as Record<string, unknown>,
          postVoteMap.get(String(row.id)) ?? 0,
        ),
      ),
      searchQuery: normalizedSearch,
      sort,
    };
  } catch (error) {
    if (isMissingSchemaError(error)) {
      return getMockCommunityPageData(slug, sort, searchQuery);
    }

    throw error;
  }
}

export async function getPostDetail(postId: string): Promise<PostDetail | null> {
  if (!hasSupabaseEnv()) {
    return getMockPostDetail(postId);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const currentUser = await getCurrentUser();
    const [{ data: postRow, error: postError }, { data: commentsRows, error: commentsError }] =
      await Promise.all([
        supabase
          .from("posts")
          .select(
            "id, title, body, category, score, comment_count, hot_score, created_at, deleted_at, community:communities(id, slug, name, zip_code, city, state_code, latitude, longitude, description), author:profiles!posts_author_id_fkey(id, username, avatar_path, karma, role, is_suspended)",
          )
          .eq("id", postId)
          .maybeSingle(),
        supabase
          .from("comments")
          .select(
            "id, post_id, parent_comment_id, body, created_at, score, depth, deleted_at, author:profiles!comments_author_id_fkey(id, username, avatar_path, karma, role, is_suspended)",
          )
          .eq("post_id", postId)
          .order("created_at", { ascending: true }),
      ]);

    if (postError) {
      throw postError;
    }
    if (commentsError) {
      throw commentsError;
    }
    if (!postRow) {
      return null;
    }

    const [postVoteMap, commentVoteMap] = await Promise.all([
      getPostVoteMap(currentUser?.id, [String(postRow.id)]),
      getCommentVoteMap(
        currentUser?.id,
        (commentsRows ?? []).map((row) => String(row.id)),
      ),
    ]);

    return {
      ...mapPost(
        postRow as unknown as Record<string, unknown>,
        postVoteMap.get(String(postRow.id)) ?? 0,
      ),
      comments: buildCommentTree(
        (commentsRows ?? []).map((row) =>
          mapComment(
            row as unknown as Record<string, unknown>,
            commentVoteMap.get(String(row.id)) ?? 0,
          ),
        ),
      ),
    };
  } catch (error) {
    if (isMissingSchemaError(error)) {
      return getMockPostDetail(postId);
    }

    throw error;
  }
}

export async function getProfilePageData(username: string): Promise<ProfilePageData | null> {
  if (!hasSupabaseEnv()) {
    return getMockProfilePageData(username);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const currentUser = await getCurrentUser();
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, username, avatar_path, karma, role, is_suspended, created_at, home:communities!profiles_home_community_id_fkey(id, slug, name, zip_code, city, state_code, latitude, longitude, description)",
      )
      .eq("username", username)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }
    if (!profileRow) {
      return null;
    }

    const [{ data: postsRows, error: postsError }, { data: commentsRows, error: commentsError }] =
      await Promise.all([
        supabase
          .from("posts")
          .select(
            "id, title, body, category, score, comment_count, hot_score, created_at, deleted_at, community:communities(id, slug, name, zip_code, city, state_code, latitude, longitude, description), author:profiles!posts_author_id_fkey(id, username, avatar_path, karma, role, is_suspended)",
          )
          .eq("author_id", profileRow.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("comments")
          .select(
            "id, post_id, parent_comment_id, body, created_at, score, depth, deleted_at, author:profiles!comments_author_id_fkey(id, username, avatar_path, karma, role, is_suspended)",
          )
          .eq("author_id", profileRow.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

    if (postsError) {
      throw postsError;
    }
    if (commentsError) {
      throw commentsError;
    }

    const [postVoteMap, commentVoteMap] = await Promise.all([
      getPostVoteMap(
        currentUser?.id,
        (postsRows ?? []).map((row) => String(row.id)),
      ),
      getCommentVoteMap(
        currentUser?.id,
        (commentsRows ?? []).map((row) => String(row.id)),
      ),
    ]);

    return {
      profile: {
        ...mapAuthor(profileRow as unknown as Record<string, unknown>),
        homeCommunity: profileRow.home
          ? mapCommunity(profileRow.home as unknown as Record<string, unknown>)
          : null,
        createdAt: String(profileRow.created_at),
      },
      posts: (postsRows ?? []).map((row) =>
        mapPost(
          row as unknown as Record<string, unknown>,
          postVoteMap.get(String(row.id)) ?? 0,
        ),
      ),
      comments: buildCommentTree(
        (commentsRows ?? []).map((row) =>
          mapComment(
            row as unknown as Record<string, unknown>,
            commentVoteMap.get(String(row.id)) ?? 0,
          ),
        ),
        "new",
      ),
    };
  } catch (error) {
    if (isMissingSchemaError(error)) {
      return getMockProfilePageData(username);
    }

    throw error;
  }
}

export async function getNotifications() {
  if (!hasSupabaseEnv()) {
    return getMockNotifications();
  }

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return [];
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, type, message, created_at, read_at, post_id, comment_id, actor:profiles!notifications_actor_id_fkey(id, username, avatar_path, karma, role, is_suspended), community:communities(id, slug, name, zip_code, city, state_code, latitude, longitude, description)",
      )
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => ({
      id: String(row.id),
      type: row.type as NotificationItem["type"],
      message: String(row.message),
      createdAt: String(row.created_at),
      readAt: typeof row.read_at === "string" ? row.read_at : null,
      postId: typeof row.post_id === "string" ? row.post_id : null,
      commentId: typeof row.comment_id === "string" ? row.comment_id : null,
      community: row.community
        ? mapCommunity(row.community as unknown as Record<string, unknown>)
        : null,
      actor: row.actor ? mapAuthor(row.actor as unknown as Record<string, unknown>) : null,
    }));
  } catch (error) {
    if (isMissingSchemaError(error)) {
      return getMockNotifications();
    }

    throw error;
  }
}

export async function getAdminReports() {
  if (!hasSupabaseEnv()) {
    return getMockReports();
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("reports")
      .select(
        "id, target_type, target_id, reason, details, status, created_at, reporter:profiles!reports_reporter_id_fkey(id, username, avatar_path, karma, role, is_suspended), reviewer:profiles!reports_reviewer_id_fkey(id, username, avatar_path, karma, role, is_suspended)",
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => ({
      id: String(row.id),
      targetType: row.target_type as ReportQueueItem["targetType"],
      targetId: String(row.target_id),
      reason: String(row.reason),
      details: typeof row.details === "string" ? row.details : null,
      status: row.status as ReportQueueItem["status"],
      createdAt: String(row.created_at),
      reporter: mapAuthor(row.reporter as unknown as Record<string, unknown>),
      reviewer: row.reviewer ? mapAuthor(row.reviewer as unknown as Record<string, unknown>) : null,
      targetPreview: `Target ${row.target_type} ${row.target_id}`,
      targetAuthor: null,
    }));
  } catch (error) {
    if (isMissingSchemaError(error)) {
      return getMockReports();
    }

    throw error;
  }
}

export async function searchCommunities(query: string) {
  if (!hasSupabaseEnv()) {
    return searchMockCommunities(query);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const normalizedSearch = normalizeSearchQuery(query);
    if (!normalizedSearch) {
      const { data, error } = await supabase.from("communities").select("*").order("city").limit(10);
      if (error) {
        throw error;
      }

      return (data ?? []).map((row) => mapCommunity(row as unknown as Record<string, unknown>));
    }

    const like = `%${normalizedSearch}%`;
    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .or(`zip_code.ilike.${like},city.ilike.${like},name.ilike.${like}`)
      .order("city")
      .limit(10);

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => mapCommunity(row as unknown as Record<string, unknown>));
  } catch (error) {
    if (isMissingSchemaError(error)) {
      return searchMockCommunities(query);
    }

    throw error;
  }
}

export async function getSettingsPageData(): Promise<SettingsPageData | null> {
  if (!hasSupabaseEnv()) {
    return getMockSettingsData();
  }

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return null;
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("communities").select("*").order("city");

    if (error) {
      throw error;
    }

    return {
      user: currentUser,
      communities: (data ?? []).map((row) => mapCommunity(row as unknown as Record<string, unknown>)),
    };
  } catch (error) {
    if (isMissingSchemaError(error)) {
      return getMockSettingsData();
    }

    throw error;
  }
}
