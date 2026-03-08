import { describe, expect, it } from "vitest";

import { commentCreateSchema, postCreateSchema, settingsSchema } from "@/lib/validation";

describe("validation schemas", () => {
  it("accepts postgres-style UUIDs used by seeded data", () => {
    const seededUuid = "00000000-0000-0000-0000-000000000104";

    expect(
      postCreateSchema.parse({
        title: "Why is the power out on 14th Street?",
        body: "Trying to verify whether crews are on-site or if this is spreading further east.",
        category: "question",
        communityId: seededUuid,
      }).communityId,
    ).toBe(seededUuid);

    expect(
      commentCreateSchema.parse({
        body: "This should still validate against seeded post IDs.",
        postId: seededUuid,
        parentCommentId: null,
      }).postId,
    ).toBe(seededUuid);

    expect(
      settingsSchema.parse({
        username: "blockwatch",
        homeCommunityId: seededUuid,
      }).homeCommunityId,
    ).toBe(seededUuid);
  });

  it("rejects malformed UUIDs", () => {
    expect(() =>
      postCreateSchema.parse({
        title: "Bad ID test",
        body: "This request should fail because the community ID is not a UUID.",
        category: "question",
        communityId: "not-a-uuid",
      }),
    ).toThrow("Invalid UUID.");
  });
});
