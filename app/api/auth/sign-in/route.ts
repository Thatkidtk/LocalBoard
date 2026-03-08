import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/env";
import { jsonError, jsonErrorResponse, parseJson } from "@/lib/http";
import { verifyCaptchaToken } from "@/lib/security/captcha";
import { enforceAuthRateLimit, getCaptchaIpAddress } from "@/lib/security/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signInSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return jsonError("Supabase is not configured for authentication in this environment.", 503);
  }

  try {
    const payload = await parseJson(request, signInSchema);
    await enforceAuthRateLimit({
      request,
      email: payload.email,
      action: "sign-in",
    });
    await verifyCaptchaToken(payload.captchaToken, getCaptchaIpAddress(request));

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
      options: {
        captchaToken: payload.captchaToken ?? undefined,
      },
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ redirectTo: "/" });
  } catch (error) {
    return jsonErrorResponse(error, "Unable to sign in.");
  }
}
