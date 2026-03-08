import { NextResponse } from "next/server";

import { jsonErrorResponse } from "@/lib/http";
import { enforcePublicSearchRateLimit } from "@/lib/security/guards";
import { searchCommunities } from "@/lib/data/queries";

export async function GET(request: Request) {
  try {
    await enforcePublicSearchRateLimit(request);
    const url = new URL(request.url);
    const communities = await searchCommunities(url.searchParams.get("q") ?? "");
    return NextResponse.json({ communities });
  } catch (error) {
    return jsonErrorResponse(error, "Unable to search communities.");
  }
}
