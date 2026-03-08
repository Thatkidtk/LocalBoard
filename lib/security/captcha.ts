import { getTurnstileSecretKey } from "@/lib/env";
import { HttpError } from "@/lib/http";

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export async function verifyCaptchaToken(token: string | null | undefined, ipAddress?: string | null) {
  const secret = getTurnstileSecretKey();
  if (!secret) {
    return;
  }

  const normalizedToken = token?.trim();
  if (!normalizedToken) {
    throw new HttpError("Complete the anti-bot challenge to continue.", 400);
  }

  const body = new URLSearchParams({
    secret,
    response: normalizedToken,
  });

  if (ipAddress) {
    body.set("remoteip", ipAddress);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new HttpError("Unable to verify the anti-bot challenge right now.", 503);
  }

  const payload = (await response.json()) as TurnstileVerifyResponse;
  if (!payload.success) {
    throw new HttpError("Anti-bot verification failed. Try again.", 400);
  }
}
