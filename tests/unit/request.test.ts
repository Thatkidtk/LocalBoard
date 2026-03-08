import { describe, expect, it } from "vitest";

import {
  getClientIp,
  getEmailRateLimitIdentifier,
  getIpRateLimitIdentifier,
  getUserRateLimitIdentifier,
} from "@/lib/security/request";

describe("request security helpers", () => {
  it("extracts the first forwarded IP address", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "203.0.113.10, 70.41.3.18",
      },
    });

    expect(getClientIp(request)).toBe("203.0.113.10");
  });

  it("hashes network, email, and user identifiers deterministically", () => {
    const request = new Request("https://example.com", {
      headers: {
        "user-agent": "Vitest",
      },
    });

    expect(getIpRateLimitIdentifier(request)).toHaveLength(64);
    expect(getEmailRateLimitIdentifier("Neighbor@Example.com")).toBe(
      getEmailRateLimitIdentifier("neighbor@example.com"),
    );
    expect(getUserRateLimitIdentifier("user-1")).toBe(getUserRateLimitIdentifier("user-1"));
  });
});
