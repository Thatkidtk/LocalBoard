import { describe, expect, it } from "vitest";

import { calculateHotScore, resolveVoteState, scoreDelta, sortPosts } from "@/lib/ranking";
import type { PostListItem } from "@/lib/types";

const basePost: PostListItem = {
  id: "post-1",
  title: "Test post",
  body: "A post body",
  category: "question",
  score: 3,
  commentCount: 2,
  hotScore: 0,
  createdAt: "2026-03-08T10:00:00.000Z",
  userVote: 0,
  isDeleted: false,
  community: {
    id: "community-1",
    slug: "chelsea-ny-10001",
    name: "Chelsea LocalBoard",
    zipCode: "10001",
    city: "Chelsea",
    stateCode: "NY",
    latitude: 40.7,
    longitude: -73.9,
  },
  author: {
    id: "user-1",
    username: "riverwatch",
    avatarUrl: null,
    karma: 0,
    role: "member",
    isSuspended: false,
  },
};

describe("ranking helpers", () => {
  it("toggles repeated votes off", () => {
    expect(resolveVoteState(1, 1)).toBe(0);
    expect(resolveVoteState(-1, -1)).toBe(0);
    expect(resolveVoteState(0, 1)).toBe(1);
  });

  it("computes score deltas from current to next vote", () => {
    expect(scoreDelta(0, 1)).toBe(1);
    expect(scoreDelta(1, -1)).toBe(-2);
    expect(scoreDelta(-1, 0)).toBe(1);
  });

  it("prefers higher hot scores when sorting hot", () => {
    const older = { ...basePost, id: "older", hotScore: calculateHotScore(40, 3, "2026-03-07T10:00:00.000Z") };
    const newer = { ...basePost, id: "newer", hotScore: calculateHotScore(20, 8, "2026-03-08T09:00:00.000Z") };

    const sorted = sortPosts([older, newer], "hot");
    expect(sorted[0]?.id).toBe("newer");
  });
});
