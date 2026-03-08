import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function parseJson<T>(request: Request, schema: ZodSchema<T>) {
  const payload = await request.json();
  return schema.parse(payload);
}
