export type PostCategory = "question" | "update" | "alert" | "discussion";
export type UserRole = "member" | "moderator" | "admin";
export type NotificationType = "reply_post" | "reply_comment" | "trending_post";
export type ReportTargetType = "post" | "comment";
export type ReportStatus = "open" | "actioned" | "dismissed";
export type SortMode = "hot" | "new" | "top";
export type CommentSortMode = "top" | "new";
export type VoteValue = -1 | 0 | 1;

export interface CommunitySummary {
  id: string;
  slug: string;
  name: string;
  zipCode: string;
  city: string;
  stateCode: string;
  latitude: number;
  longitude: number;
  description?: string;
  distanceMiles?: number;
}

export interface AuthorSummary {
  id: string;
  username: string;
  avatarUrl: string | null;
  karma: number;
  role: UserRole;
  isSuspended: boolean;
}

export interface PostListItem {
  id: string;
  title: string;
  body: string;
  category: PostCategory;
  score: number;
  commentCount: number;
  hotScore: number;
  createdAt: string;
  userVote: VoteValue;
  community: CommunitySummary;
  author: AuthorSummary;
  isDeleted: boolean;
}

export interface CommentNode {
  id: string;
  postId: string;
  parentCommentId: string | null;
  body: string;
  createdAt: string;
  score: number;
  userVote: VoteValue;
  depth: number;
  renderDepth: number;
  isDeleted: boolean;
  author: AuthorSummary;
  replies: CommentNode[];
}

export interface PostDetail extends PostListItem {
  comments: CommentNode[];
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: string;
  readAt: string | null;
  postId: string | null;
  commentId: string | null;
  community: CommunitySummary | null;
  actor: AuthorSummary | null;
}

export interface ReportQueueItem {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
  reporter: AuthorSummary;
  reviewer: AuthorSummary | null;
  targetPreview: string;
  targetAuthor: AuthorSummary | null;
}

export interface ProfilePageData {
  profile: AuthorSummary & {
    email?: string;
    homeCommunity: CommunitySummary | null;
    createdAt: string;
  };
  posts: PostListItem[];
  comments: CommentNode[];
}

export interface CurrentUser {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  karma: number;
  role: UserRole;
  homeCommunityId: string | null;
  homeCommunitySlug: string | null;
  isSuspended: boolean;
}

export interface HomePageData {
  activeCommunity: CommunitySummary;
  featuredCommunities: CommunitySummary[];
  nearbyCommunities: CommunitySummary[];
  trendingPosts: PostListItem[];
}

export interface CommunityPageData {
  community: CommunitySummary;
  nearbyCommunities: CommunitySummary[];
  posts: PostListItem[];
  searchQuery: string;
  sort: SortMode;
}

export interface SettingsPageData {
  user: CurrentUser;
  communities: CommunitySummary[];
}
