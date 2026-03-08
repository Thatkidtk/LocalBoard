import { describe, expect, it } from "vitest";

import { buildCommentTree } from "@/lib/comments";
import type { CommentNode } from "@/lib/types";

const comments: CommentNode[] = [
  {
    id: "c1",
    postId: "p1",
    parentCommentId: null,
    body: "Parent",
    createdAt: "2026-03-08T10:00:00.000Z",
    score: 5,
    userVote: 0,
    depth: 0,
    renderDepth: 0,
    isDeleted: false,
    author: {
      id: "u1",
      username: "riverwatch",
      avatarUrl: null,
      karma: 0,
      role: "member",
      isSuspended: false,
    },
    replies: [],
  },
  {
    id: "c2",
    postId: "p1",
    parentCommentId: "c1",
    body: "Reply",
    createdAt: "2026-03-08T10:05:00.000Z",
    score: 3,
    userVote: 0,
    depth: 1,
    renderDepth: 1,
    isDeleted: false,
    author: {
      id: "u2",
      username: "blockcaptain",
      avatarUrl: null,
      karma: 0,
      role: "member",
      isSuspended: false,
    },
    replies: [],
  },
];

describe("comment tree", () => {
  it("nests replies under their parent", () => {
    const tree = buildCommentTree(comments);
    expect(tree).toHaveLength(1);
    expect(tree[0]?.replies).toHaveLength(1);
    expect(tree[0]?.replies[0]?.id).toBe("c2");
  });
});
