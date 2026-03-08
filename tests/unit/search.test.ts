import { describe, expect, it } from "vitest";

import { buildTsQuery, matchesSearch, normalizeSearchQuery } from "@/lib/search";

describe("search helpers", () => {
  it("normalizes whitespace", () => {
    expect(normalizeSearchQuery("  power   outage ")).toBe("power outage");
  });

  it("builds a prefix tsquery expression", () => {
    expect(buildTsQuery("power outage")).toBe("power:* & outage:*");
  });

  it("matches search terms case-insensitively", () => {
    expect(matchesSearch("Power outage near 14th Street", "outage")).toBe(true);
    expect(matchesSearch("Power outage near 14th Street", "flood")).toBe(false);
  });
});
