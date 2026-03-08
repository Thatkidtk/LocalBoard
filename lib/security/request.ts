import { createHash } from "node:crypto";

import { getRateLimitSalt } from "@/lib/env";

const IP_HEADER_CANDIDATES = [
  "cf-connecting-ip",
  "x-real-ip",
  "x-forwarded-for",
  "x-client-ip",
  "fly-client-ip",
  "x-vercel-forwarded-for",
];

export function getClientIp(request: Request) {
  for (const headerName of IP_HEADER_CANDIDATES) {
    const value = request.headers.get(headerName);
    if (!value) {
      continue;
    }

    if (headerName === "x-forwarded-for") {
      const forwardedIp = value
        .split(",")
        .map((part) => part.trim())
        .find(Boolean);

      if (forwardedIp) {
        return forwardedIp;
      }

      continue;
    }

    return value.trim();
  }

  return null;
}

export function hashSensitiveValue(value: string) {
  return createHash("sha256")
    .update(`${getRateLimitSalt()}:${value}`)
    .digest("hex");
}

export function getIpRateLimitIdentifier(request: Request) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent")?.trim().slice(0, 160) ?? "unknown-agent";
  const source = ip ? `ip:${ip}` : `ua:${userAgent}`;
  return hashSensitiveValue(source);
}

export function getEmailRateLimitIdentifier(email: string) {
  return hashSensitiveValue(`email:${email.trim().toLowerCase()}`);
}

export function getUserRateLimitIdentifier(userId: string) {
  return hashSensitiveValue(`user:${userId}`);
}
