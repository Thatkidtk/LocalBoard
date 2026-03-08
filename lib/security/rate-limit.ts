import { HttpError } from "@/lib/http";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export interface RateLimitRule {
  scope: string;
  identifier: string;
  maxRequests: number;
  windowSeconds: number;
  message: string;
}

type RateLimitRow = {
  allowed: boolean;
  remaining: number;
  retry_after_seconds: number;
  current_count: number;
  reset_at: string;
};

function isMissingRateLimitRpc(error: { message?: string; code?: string } | null) {
  return Boolean(
    error?.message?.includes("public.consume_rate_limit") ||
      error?.message?.includes("schema cache"),
  );
}

async function consumeRateLimit(rule: RateLimitRule) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    limit_scope: rule.scope,
    subject_identifier: rule.identifier,
    max_requests: rule.maxRequests,
    window_seconds: rule.windowSeconds,
  });

  if (error) {
    if (isMissingRateLimitRpc(error)) {
      if (process.env.NODE_ENV === "production") {
        throw new HttpError(
          "Abuse protection is not initialized. Apply the latest Supabase migrations.",
          503,
        );
      }

      return null;
    }

    throw error;
  }

  const row = (Array.isArray(data) ? data[0] : data) as RateLimitRow | null;
  if (!row) {
    throw new Error(`Rate limit check for ${rule.scope} returned no result.`);
  }

  if (!row.allowed) {
    throw new HttpError(rule.message, 429, {
      "Retry-After": String(row.retry_after_seconds),
      "X-RateLimit-Limit": String(rule.maxRequests),
      "X-RateLimit-Remaining": String(row.remaining),
    });
  }

  return row;
}

export async function enforceRateLimit(rules: RateLimitRule[]) {
  for (const rule of rules) {
    await consumeRateLimit(rule);
  }
}
