import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export class HttpError extends Error {
  status: number;
  headers?: HeadersInit;

  constructor(message: string, status = 400, headers?: HeadersInit) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.headers = headers;
  }
}

export function jsonErrorResponse(
  error: unknown,
  fallbackMessage: string,
  fallbackStatus = 400,
) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: error.message },
      {
        status: error.status,
        headers: error.headers,
      },
    );
  }

  return jsonError(error instanceof Error ? error.message : fallbackMessage, fallbackStatus);
}

export async function parseJson<T>(request: Request, schema: ZodSchema<T>) {
  const payload = await request.json();

  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(error.issues[0]?.message ?? "Invalid request.", 400);
    }

    throw error;
  }
}
