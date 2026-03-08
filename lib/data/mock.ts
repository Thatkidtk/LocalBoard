import { buildCommentTree } from "@/lib/comments";
import { calculateHotScore, sortPosts } from "@/lib/ranking";
import { matchesSearch } from "@/lib/search";
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
} from "@/lib/types";
import { createExcerpt, slugifyCommunity } from "@/lib/utils";

function isoHoursAgo(hoursAgo: number) {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

const communitySeed = [
  ["10001", "Chelsea", "NY", 40.7506, -73.9971],
  ["10003", "East Village", "NY", 40.7314, -73.9897],
  ["11215", "Park Slope", "NY", 40.6681, -73.9806],
  ["02139", "Cambridgeport", "MA", 42.3647, -71.1043],
  ["19103", "Rittenhouse", "PA", 39.9522, -75.1741],
  ["60614", "Lincoln Park", "IL", 41.9227, -87.6533],
  ["73301", "Central Austin", "TX", 30.2666, -97.7333],
  ["94110", "Mission District", "CA", 37.7487, -122.4158],
  ["98101", "Downtown Seattle", "WA", 47.6105, -122.3348],
  ["30309", "Midtown Atlanta", "GA", 33.7823, -84.3885],
 ] as const satisfies ReadonlyArray<readonly [string, string, string, number, number]>;

const communities: CommunitySummary[] = communitySeed.map(
  ([zipCode, city, stateCode, latitude, longitude], index) => ({
  id: `community-${index + 1}`,
  slug: slugifyCommunity(city, stateCode, zipCode),
  name: `${city} LocalBoard`,
  zipCode,
  city,
  stateCode,
  latitude,
  longitude,
  description: `Community updates, local questions, and neighborhood alerts for ${city}, ${stateCode}.`,
}));

const neighbors = new Map<string, Array<{ slug: string; distanceMiles: number }>>([
  [communities[0].slug, [{ slug: communities[1].slug, distanceMiles: 2.1 }, { slug: communities[2].slug, distanceMiles: 5.4 }]],
  [communities[1].slug, [{ slug: communities[0].slug, distanceMiles: 2.1 }, { slug: communities[2].slug, distanceMiles: 4.7 }]],
  [communities[2].slug, [{ slug: communities[1].slug, distanceMiles: 4.7 }, { slug: communities[0].slug, distanceMiles: 5.4 }]],
  [communities[3].slug, [{ slug: communities[4].slug, distanceMiles: 271.4 }]],
  [communities[4].slug, [{ slug: communities[3].slug, distanceMiles: 271.4 }]],
  [communities[5].slug, [{ slug: communities[9].slug, distanceMiles: 588.2 }]],
  [communities[6].slug, [{ slug: communities[9].slug, distanceMiles: 812.6 }]],
  [communities[7].slug, [{ slug: communities[8].slug, distanceMiles: 679.4 }]],
  [communities[8].slug, [{ slug: communities[7].slug, distanceMiles: 679.4 }]],
  [communities[9].slug, [{ slug: communities[6].slug, distanceMiles: 812.6 }, { slug: communities[5].slug, distanceMiles: 588.2 }]],
]);

const authors: AuthorSummary[] = [
  {
    id: "user-1",
    username: "riverwatch",
    avatarUrl: null,
    karma: 1420,
    role: "member",
    isSuspended: false,
  },
  {
    id: "user-2",
    username: "blockcaptain",
    avatarUrl: null,
    karma: 2810,
    role: "moderator",
    isSuspended: false,
  },
  {
    id: "user-3",
    username: "cornerstorekate",
    avatarUrl: null,
    karma: 930,
    role: "member",
    isSuspended: false,
  },
  {
    id: "user-4",
    username: "citydesk",
    avatarUrl: null,
    karma: 5110,
    role: "admin",
    isSuspended: false,
  },
];

function authorById(authorId: string) {
  return authors.find((author) => author.id === authorId)!;
}

function communityBySlug(slug: string) {
  return communities.find((community) => community.slug === slug) ?? communities[0];
}

const posts: PostListItem[] = [
  {
    id: "post-1",
    title: "Why did the Walmart on 6th close overnight?",
    body: "Drove by this morning and the doors were chained. Did the city pull permits, or is this temporary renovation work?",
    category: "question",
    score: 51,
    commentCount: 9,
    hotScore: calculateHotScore(51, 9, isoHoursAgo(2)),
    createdAt: isoHoursAgo(2),
    userVote: 0,
    community: communities[6],
    author: authorById("user-1"),
    isDeleted: false,
  },
  {
    id: "post-2",
    title: "Power outage near 14th Street and 8th Ave",
    body: "ConEd crews are on-site now. Traffic lights are out for two blocks, so expect a slow crawl through the intersection.",
    category: "alert",
    score: 74,
    commentCount: 5,
    hotScore: calculateHotScore(74, 5, isoHoursAgo(1)),
    createdAt: isoHoursAgo(1),
    userVote: 0,
    community: communities[0],
    author: authorById("user-2"),
    isDeleted: false,
  },
  {
    id: "post-3",
    title: "Mission playground reopening moved to Saturday",
    body: "Rec department pushed the ribbon cutting one day because crews are still replacing the soft flooring around the new slides.",
    category: "update",
    score: 37,
    commentCount: 4,
    hotScore: calculateHotScore(37, 4, isoHoursAgo(6)),
    createdAt: isoHoursAgo(6),
    userVote: 0,
    community: communities[7],
    author: authorById("user-3"),
    isDeleted: false,
  },
  {
    id: "post-4",
    title: "Anyone know why garbage pickup skipped 7th Ave?",
    body: "Our whole block still has bags on the curb. Trying to figure out if there was a schedule change or labor issue.",
    category: "discussion",
    score: 22,
    commentCount: 8,
    hotScore: calculateHotScore(22, 8, isoHoursAgo(11)),
    createdAt: isoHoursAgo(11),
    userVote: 0,
    community: communities[2],
    author: authorById("user-1"),
    isDeleted: false,
  },
  {
    id: "post-5",
    title: "Blue Line platform flooding at Jackson",
    body: "Water is coming through the west stairwell again. CTA staff are redirecting people to the other entrance.",
    category: "alert",
    score: 63,
    commentCount: 11,
    hotScore: calculateHotScore(63, 11, isoHoursAgo(3)),
    createdAt: isoHoursAgo(3),
    userVote: 0,
    community: communities[5],
    author: authorById("user-2"),
    isDeleted: false,
  },
  {
    id: "post-6",
    title: "Small business grants info session at the library tonight",
    body: "The neighborhood business alliance is hosting a Q&A at 6:30 PM for anyone applying to the city storefront grant round.",
    category: "update",
    score: 18,
    commentCount: 2,
    hotScore: calculateHotScore(18, 2, isoHoursAgo(16)),
    createdAt: isoHoursAgo(16),
    userVote: 0,
    community: communities[4],
    author: authorById("user-4"),
    isDeleted: false,
  },
  {
    id: "post-7",
    title: "Street racing noise getting worse on weekends",
    body: "We have had two near-collisions this month on Peachtree. Curious whether anyone has had success getting traffic enforcement to respond.",
    category: "discussion",
    score: 29,
    commentCount: 7,
    hotScore: calculateHotScore(29, 7, isoHoursAgo(8)),
    createdAt: isoHoursAgo(8),
    userVote: 0,
    community: communities[9],
    author: authorById("user-3"),
    isDeleted: false,
  },
  {
    id: "post-8",
    title: "Community board agenda posted for next Tuesday",
    body: "Housing permits, school crossing redesign, and the late-night liquor variance are all on the agenda this week.",
    category: "update",
    score: 14,
    commentCount: 1,
    hotScore: calculateHotScore(14, 1, isoHoursAgo(22)),
    createdAt: isoHoursAgo(22),
    userVote: 0,
    community: communities[1],
    author: authorById("user-2"),
    isDeleted: false,
  },
];

const commentSeed: Array<Omit<CommentNode, "renderDepth" | "replies">> = [
  {
    id: "comment-1",
    postId: "post-1",
    parentCommentId: null,
    body: "City permit records show an emergency plumbing issue filed yesterday. That usually means a short closure, not a permanent one.",
    createdAt: isoHoursAgo(1.5),
    score: 14,
    userVote: 0,
    depth: 0,
    isDeleted: false,
    author: authorById("user-2"),
  },
  {
    id: "comment-2",
    postId: "post-1",
    parentCommentId: "comment-1",
    body: "That lines up with what an employee told me. They said they hope to reopen after inspections.",
    createdAt: isoHoursAgo(1.1),
    score: 8,
    userVote: 0,
    depth: 1,
    isDeleted: false,
    author: authorById("user-3"),
  },
  {
    id: "comment-3",
    postId: "post-2",
    parentCommentId: null,
    body: "Saw a transformer blow at about 5:10 AM. If you are driving through there, four-way stop rules are in effect.",
    createdAt: isoHoursAgo(0.7),
    score: 22,
    userVote: 0,
    depth: 0,
    isDeleted: false,
    author: authorById("user-1"),
  },
  {
    id: "comment-4",
    postId: "post-5",
    parentCommentId: null,
    body: "The flooding is from runoff around the construction fencing. It happened twice last month too.",
    createdAt: isoHoursAgo(2.6),
    score: 19,
    userVote: 0,
    depth: 0,
    isDeleted: false,
    author: authorById("user-4"),
  },
  {
    id: "comment-5",
    postId: "post-7",
    parentCommentId: null,
    body: "Please keep filing 311 reports. The volume is what got the city to install speed cushions on our block.",
    createdAt: isoHoursAgo(5.2),
    score: 9,
    userVote: 0,
    depth: 0,
    isDeleted: false,
    author: authorById("user-2"),
  },
];

const notifications: NotificationItem[] = [
  {
    id: "notification-1",
    type: "reply_post",
    message: "blockcaptain replied to your post about the Walmart closure.",
    createdAt: isoHoursAgo(1.3),
    readAt: null,
    postId: "post-1",
    commentId: "comment-1",
    community: communities[6],
    actor: authorById("user-2"),
  },
  {
    id: "notification-2",
    type: "trending_post",
    message: "Power outage near 14th Street is trending in Chelsea.",
    createdAt: isoHoursAgo(0.5),
    readAt: null,
    postId: "post-2",
    commentId: null,
    community: communities[0],
    actor: null,
  },
];

const reports: ReportQueueItem[] = [
  {
    id: "report-1",
    targetType: "post",
    targetId: "post-7",
    reason: "Missing source",
    details: "The claim about near-collisions needs context before it spirals.",
    status: "open",
    createdAt: isoHoursAgo(4),
    reporter: authorById("user-3"),
    reviewer: null,
    targetPreview: createExcerpt(posts.find((post) => post.id === "post-7")?.body ?? ""),
    targetAuthor: authorById("user-3"),
  },
];

function commentsForPost(postId: string) {
  return commentSeed
    .filter((comment) => comment.postId === postId)
    .map((comment) => ({ ...comment, renderDepth: comment.depth, replies: [] }));
}

function nearbyCommunitiesFor(slug: string) {
  const linked = neighbors.get(slug) ?? [];

  return linked
    .map(({ slug: nearbySlug, distanceMiles }) => {
      const community = communityBySlug(nearbySlug);
      return { ...community, distanceMiles };
    })
    .slice(0, 6);
}

export function getMockHomePageData(selectedCommunitySlug?: string | null): HomePageData {
  const activeCommunity = communityBySlug(selectedCommunitySlug ?? communities[0].slug);
  const trendingPosts = sortPosts(
    posts.filter((post) => post.community.slug === activeCommunity.slug),
    "hot",
  );

  return {
    activeCommunity,
    featuredCommunities: communities.slice(0, 6),
    nearbyCommunities: nearbyCommunitiesFor(activeCommunity.slug),
    trendingPosts,
  };
}

export function getMockCommunityPageData(
  slug: string,
  sort: SortMode,
  searchQuery: string,
): CommunityPageData {
  const community = communityBySlug(slug);
  const scopedPosts = posts.filter((post) => post.community.slug === community.slug);
  const filtered = scopedPosts.filter((post) => {
    return matchesSearch(`${post.title} ${post.body}`, searchQuery);
  });

  return {
    community,
    nearbyCommunities: nearbyCommunitiesFor(community.slug),
    posts: sortPosts(filtered, sort),
    searchQuery,
    sort,
  };
}

export function getMockPostDetail(postId: string): PostDetail | null {
  const post = posts.find((candidate) => candidate.id === postId);

  if (!post) {
    return null;
  }

  return {
    ...post,
    comments: buildCommentTree(commentsForPost(postId)),
  };
}

export function getMockProfilePageData(username: string): ProfilePageData | null {
  const profile = authors.find((candidate) => candidate.username === username);

  if (!profile) {
    return null;
  }

  const homeCommunity = posts.find((post) => post.author.id === profile.id)?.community ?? communities[0];

  return {
    profile: {
      ...profile,
      homeCommunity,
      createdAt: isoHoursAgo(180),
    },
    posts: posts.filter((post) => post.author.id === profile.id),
    comments: buildCommentTree(
      commentSeed
        .filter((comment) => comment.author.id === profile.id)
        .map((comment) => ({ ...comment, renderDepth: comment.depth, replies: [] })),
    ),
  };
}

export function getMockNotifications() {
  return notifications;
}

export function getMockReports() {
  return reports;
}

export function searchMockCommunities(query: string) {
  return communities.filter((community) => {
    const haystack = `${community.city} ${community.stateCode} ${community.zipCode} ${community.name}`;
    return matchesSearch(haystack, query);
  });
}

export function getMockSettingsData(): SettingsPageData {
  return {
    user: {
      id: authors[1].id,
      email: "moderator@localboard.dev",
      username: authors[1].username,
      avatarUrl: null,
      karma: authors[1].karma,
      role: authors[1].role,
      homeCommunityId: communities[0].id,
      homeCommunitySlug: communities[0].slug,
      isSuspended: false,
    },
    communities,
  };
}

export function listMockCommunities() {
  return communities;
}
