import { NextResponse } from "next/server";

import { searchCommunities } from "@/lib/data/queries";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const communities = await searchCommunities(url.searchParams.get("q") ?? "");
  return NextResponse.json({ communities });
}
