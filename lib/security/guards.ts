import type { CurrentUser } from "@/lib/types";
import { HttpError } from "@/lib/http";
import { getClientIp, getEmailRateLimitIdentifier, getIpRateLimitIdentifier, getUserRateLimitIdentifier } from "@/lib/security/request";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { enforceContentGuard } from "@/lib/security/spam";

type RateLimitProfile = {
  scope: string;
  maxRequests: number;
  windowSeconds: number;
  message: string;
};

type AuthRateLimitOptions = {
  request: Request;
  email: string;
  action: "sign-in" | "sign-up";
};

type MutationRateLimitOptions = {
  request: Request;
  currentUser: CurrentUser;
  actionLabel: string;
  userLimit: RateLimitProfile;
  ipLimit: RateLimitProfile;
  content?:
    | {
        scope: "post" | "comment" | "report";
        title?: string;
        body: string;
        maxLinks: number;
        duplicateWindowSeconds: number;
        duplicateMessage: string;
      }
    | undefined;
};

function assertVerifiedEmail(currentUser: CurrentUser, actionLabel: string) {
  if (!currentUser.isEmailVerified) {
    throw new HttpError(`Verify your email address before you can ${actionLabel}.`, 403);
  }
}

export async function enforceAuthRateLimit({ request, email, action }: AuthRateLimitOptions) {
  const ipIdentifier = getIpRateLimitIdentifier(request);
  const emailIdentifier = getEmailRateLimitIdentifier(email);

  if (action === "sign-up") {
    await enforceRateLimit([
      {
        scope: "auth:sign-up:ip",
        identifier: ipIdentifier,
        maxRequests: 6,
        windowSeconds: 60 * 60,
        message: "Too many signup attempts from this network. Try again in a little while.",
      },
      {
        scope: "auth:sign-up:email",
        identifier: emailIdentifier,
        maxRequests: 3,
        windowSeconds: 24 * 60 * 60,
        message: "Too many signup attempts for this email address. Try again later.",
      },
    ]);

    return;
  }

  await enforceRateLimit([
    {
      scope: "auth:sign-in:ip",
      identifier: ipIdentifier,
      maxRequests: 20,
      windowSeconds: 15 * 60,
      message: "Too many sign-in attempts from this network. Try again in a little while.",
    },
    {
      scope: "auth:sign-in:email",
      identifier: emailIdentifier,
      maxRequests: 10,
      windowSeconds: 15 * 60,
      message: "Too many sign-in attempts for this account. Try again later.",
    },
  ]);
}

export async function enforceMutationGuard({
  request,
  currentUser,
  actionLabel,
  userLimit,
  ipLimit,
  content,
}: MutationRateLimitOptions) {
  assertVerifiedEmail(currentUser, actionLabel);

  const ipIdentifier = getIpRateLimitIdentifier(request);
  const userIdentifier = getUserRateLimitIdentifier(currentUser.id);

  await enforceRateLimit([
    {
      ...userLimit,
      identifier: userIdentifier,
    },
    {
      ...ipLimit,
      identifier: ipIdentifier,
    },
  ]);

  if (content) {
    await enforceContentGuard({
      ...content,
      actorId: currentUser.id,
      identifier: ipIdentifier,
    });
  }
}

export async function enforcePublicSearchRateLimit(request: Request) {
  await enforceRateLimit([
    {
      scope: "search:communities:ip",
      identifier: getIpRateLimitIdentifier(request),
      maxRequests: 90,
      windowSeconds: 60,
      message: "Community search is temporarily rate limited. Try again in a minute.",
    },
  ]);
}

export function getCaptchaIpAddress(request: Request) {
  return getClientIp(request);
}
