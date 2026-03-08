import type { PostListItem, SortMode, VoteValue } from "@/lib/types";

const EPOCH_BASE = 1_700_000_000;

export function calculateHotScore(score: number, commentCount: number, createdAt: string) {
  const order = Math.log10(Math.max(Math.abs(score) + commentCount * 0.6, 1));
  const sign = score === 0 ? 0 : score > 0 ? 1 : -1;
  const seconds = new Date(createdAt).getTime() / 1000 - EPOCH_BASE;

  return Number((sign * order + seconds / 45_000).toFixed(7));
}

export function resolveVoteState(currentValue: VoteValue, incomingValue: -1 | 1): VoteValue {
  if (currentValue === incomingValue) {
    return 0;
  }

  return incomingValue;
}

export function scoreDelta(currentValue: VoteValue, nextValue: VoteValue) {
  return nextValue - currentValue;
}

export function sortPosts(posts: PostListItem[], sort: SortMode) {
  const next = [...posts];

  if (sort === "new") {
    next.sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
    return next;
  }

  if (sort === "top") {
    next.sort((left, right) => right.score - left.score);
    return next;
  }

  next.sort((left, right) => right.hotScore - left.hotScore);
  return next;
}
