import { NextResponse } from "next/server";

import {
  apiErrorResponse,
  type SessionRouteContext,
  sessionIdFrom,
  sessionResponse,
} from "@/lib/server/http";
import { getMirrorSessionService } from "@/lib/server/session-service";

export const runtime = "nodejs";

export async function GET(_request: Request, context: SessionRouteContext): Promise<Response> {
  try {
    const id = await sessionIdFrom(context);
    const session = await getMirrorSessionService().get(id);
    return sessionResponse(session);
  } catch (error: unknown) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: SessionRouteContext): Promise<Response> {
  try {
    const id = await sessionIdFrom(context);
    await getMirrorSessionService().delete(id);
    return NextResponse.json({ deleted: true, sessionId: id });
  } catch (error: unknown) {
    return apiErrorResponse(error);
  }
}
