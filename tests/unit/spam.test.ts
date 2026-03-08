import { describe, expect, it } from "vitest";

import { createContentFingerprint, detectSpamContent } from "@/lib/security/spam";

describe("spam protections", () => {
  it("rejects submissions with too many links", () => {
    const reason = detectSpamContent(
      "Neighborhood update",
      "https://a.example https://b.example https://c.example https://d.example https://e.example",
      4,
    );

    expect(reason).toContain("Too many links");
  });

  it("rejects highly repetitive content", () => {
    const reason = detectSpamContent(
      "Noise",
      "alert alert alert alert alert alert alert near the station alert alert",
      2,
    );

    expect(reason).toBeTruthy();
  });

  it("creates stable fingerprints for semantically identical content", () => {
    expect(
      createContentFingerprint("Power outage", "Power outage near 8th Ave!!!"),
    ).toBe(
      createContentFingerprint(" power outage ", "power outage near 8th ave"),
    );
  });
});
