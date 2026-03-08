import { COMMENT_UI_DEPTH_LIMIT } from "@/lib/constants";
import type { CommentNode, CommentSortMode } from "@/lib/types";

export function sortComments(comments: CommentNode[], sort: CommentSortMode) {
  const next = [...comments];

  next.sort((left, right) => {
    if (sort === "new") {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }

    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });

  return next;
}

export function buildCommentTree(flatComments: CommentNode[], sort: CommentSortMode = "top") {
  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const comment of flatComments) {
    byId.set(comment.id, {
      ...comment,
      replies: [],
      renderDepth: Math.min(comment.depth, COMMENT_UI_DEPTH_LIMIT),
    });
  }

  for (const comment of byId.values()) {
    if (!comment.parentCommentId) {
      roots.push(comment);
      continue;
    }

    const parent = byId.get(comment.parentCommentId);
    if (!parent) {
      roots.push(comment);
      continue;
    }

    parent.replies.push(comment);
  }

  const applySort = (nodes: CommentNode[]) => {
    const sorted = sortComments(nodes, sort);

    for (const node of sorted) {
      node.replies = applySort(node.replies);
    }

    return sorted;
  };

  return applySort(roots);
}
