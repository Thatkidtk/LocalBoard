import type {
  CommentSortMode,
  NotificationType,
  PostCategory,
  ReportStatus,
  ReportTargetType,
  SortMode,
  UserRole,
} from "@/lib/types";

export const POST_CATEGORIES: PostCategory[] = [
  "question",
  "update",
  "alert",
  "discussion",
];

export const FEED_SORTS: SortMode[] = ["hot", "new", "top"];
export const COMMENT_SORTS: CommentSortMode[] = ["top", "new"];
export const USER_ROLES: UserRole[] = ["member", "moderator", "admin"];
export const NOTIFICATION_TYPES: NotificationType[] = [
  "reply_post",
  "reply_comment",
  "trending_post",
];
export const REPORT_TARGET_TYPES: ReportTargetType[] = ["post", "comment"];
export const REPORT_STATUSES: ReportStatus[] = ["open", "actioned", "dismissed"];

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  question: "Question",
  update: "Update",
  alert: "Alert",
  discussion: "Discussion",
};

export const SORT_LABELS: Record<SortMode, string> = {
  hot: "Hot",
  new: "New",
  top: "Top",
};

export const COMMENT_UI_DEPTH_LIMIT = 4;
export const TRENDING_NOTIFICATION_LIMIT = 3;
