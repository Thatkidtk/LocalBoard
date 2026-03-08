import { createHash } from "node:crypto";

import { HttpError } from "@/lib/http";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

type ContentGuardOptions = {
  scope: "post" | "comment" | "report";
  actorId: string;
  identifier: string;
  title?: string;
  body: string;
  maxLinks: number;
  duplicateWindowSeconds: number;
  duplicateMessage: string;
};

function stripUrls(value: string) {
  return value.replace(/https?:\/\/\S+/gi, " ").replace(/www\.\S+/gi, " ");
}

function tokenize(value: string) {
  return stripUrls(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function normalizeFingerprintText(value: string) {
  return tokenize(value).join(" ");
}

export function createContentFingerprint(title: string | undefined, body: string) {
  const normalized = normalizeFingerprintText(`${title ?? ""}\n${body}`.trim());
  return createHash("sha256").update(normalized).digest("hex");
}

export function detectSpamContent(title: string | undefined, body: string, maxLinks: number) {
  const combined = `${title ?? ""}\n${body}`.trim();
  const linkCount = (combined.match(/https?:\/\/|www\./gi) ?? []).length;
  if (linkCount > maxLinks) {
    return `Too many links in a single submission. Limit is ${maxLinks}.`;
  }

  if (/<[a-z][\s\S]*>/i.test(combined)) {
    return "HTML markup is not allowed in posts or comments.";
  }

  if (/(.)\1{11,}/.test(combined.replace(/\s+/g, ""))) {
    return "Repeated characters make this look like spam.";
  }

  if (/\b(\w+)(?:\W+\1){5,}\b/i.test(combined)) {
    return "Repeated text makes this look like spam.";
  }

  const tokens = tokenize(combined);
  if (tokens.length >= 18) {
    const uniqueTokenRatio = new Set(tokens).size / tokens.length;
    if (uniqueTokenRatio < 0.35) {
      return "This message is too repetitive to publish.";
    }
  }

  return null;
}

function isMissingFingerprintRpc(error: { message?: string; code?: string } | null) {
  return Boolean(
    error?.message?.includes("public.record_content_fingerprint") ||
      error?.message?.includes("schema cache"),
  );
}

export async function enforceContentGuard({
  scope,
  actorId,
  identifier,
  title,
  body,
  maxLinks,
  duplicateWindowSeconds,
  duplicateMessage,
}: ContentGuardOptions) {
  const spamReason = detectSpamContent(title, body, maxLinks);
  if (spamReason) {
    throw new HttpError(spamReason, 422);
  }

  const fingerprint = createContentFingerprint(title, body);
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.rpc("record_content_fingerprint", {
    content_scope: scope,
    content_fingerprint: fingerprint,
    actor_uuid: actorId,
    subject_identifier: identifier,
    duplicate_window_seconds: duplicateWindowSeconds,
  });

  if (error) {
    if (isMissingFingerprintRpc(error)) {
      if (process.env.NODE_ENV === "production") {
        throw new HttpError(
          "Abuse protection is not initialized. Apply the latest Supabase migrations.",
          503,
        );
      }

      return;
    }

    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (row?.is_duplicate) {
    throw new HttpError(duplicateMessage, 409);
  }
}
