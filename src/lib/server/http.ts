import { NextResponse } from "next/server";
import { z } from "zod";

import { DomainError } from "../domain/errors";
import type { MirrorSession } from "../domain/schemas";

export const SessionIdSchema = z.string().uuid();

export interface SessionRouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function sessionIdFrom(context: SessionRouteContext): Promise<string> {
  const { id } = await context.params;
  return SessionIdSchema.parse(id);
}

export async function readJson<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new DomainError("请求内容不是有效的 JSON。", "VALIDATION_ERROR", 400);
  }
  return schema.parse(body);
}

export function sessionResponse(session: MirrorSession, status = 200): NextResponse {
  return NextResponse.json({ sessionId: session.id, session }, { status });
}

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof z.ZodError) {
    const firstIssue = error.issues[0];
    return NextResponse.json(
      {
        error: firstIssue?.message ?? "提交的内容无法通过校验。",
        code: "VALIDATION_ERROR",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  if (error instanceof DomainError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode },
    );
  }

  return NextResponse.json(
    {
      error: "镜室暂时无法处理这次请求，请稍后再试。",
      code: "INTERNAL_ERROR",
    },
    { status: 500 },
  );
}
