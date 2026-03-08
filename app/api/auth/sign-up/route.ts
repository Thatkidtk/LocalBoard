import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/env";
import { jsonError, jsonErrorResponse, parseJson } from "@/lib/http";
import { verifyCaptchaToken } from "@/lib/security/captcha";
import { enforceAuthRateLimit, getCaptchaIpAddress } from "@/lib/security/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signUpSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return jsonError("Supabase is not configured for authentication in this environment.", 503);
  }

  try {
    const payload = await parseJson(request, signUpSchema);
    await enforceAuthRateLimit({
      request,
      email: payload.email,
      action: "sign-up",
    });
    await verifyCaptchaToken(payload.captchaToken, getCaptchaIpAddress(request));

    const supabase = await createSupabaseServerClient();
    const origin = new URL(request.url).origin;
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        captchaToken: payload.captchaToken ?? undefined,
        data: {
          username: payload.username,
          home_community_slug: payload.communitySlug,
        },
      },
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      requiresEmailVerification: !data.session,
      redirectTo: data.session ? `/c/${payload.communitySlug}` : null,
      message: data.session
        ? null
        : "Check your email to verify your account, then return here to sign in.",
    });
  } catch (error) {
    return jsonErrorResponse(error, "Unable to create account.");
  }
}
