import { NextResponse } from "next/server";

import { apiErrorResponse, type SessionRouteContext, sessionIdFrom } from "@/lib/server/http";
import { getMirrorSessionService } from "@/lib/server/session-service";

export const runtime = "nodejs";

export async function GET(_request: Request, context: SessionRouteContext): Promise<Response> {
  try {
    const id = await sessionIdFrom(context);
    const service = getMirrorSessionService();
    const session = await service.get(id);
    const result = await service.getResult(id);
    return NextResponse.json({ sessionId: id, session, result });
  } catch (error: unknown) {
    return apiErrorResponse(error);
  }
}
