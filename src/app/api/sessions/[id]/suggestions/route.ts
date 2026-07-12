import { NextResponse } from "next/server";

import { apiErrorResponse, type SessionRouteContext, sessionIdFrom } from "@/lib/server/http";
import { getMirrorSessionService } from "@/lib/server/session-service";

export const runtime = "nodejs";

async function suggestionsResponse(context: SessionRouteContext): Promise<Response> {
  try {
    const id = await sessionIdFrom(context);
    const suggestionSet = await getMirrorSessionService().suggestions(id);
    return NextResponse.json({ sessionId: id, ...suggestionSet });
  } catch (error: unknown) {
    return apiErrorResponse(error);
  }
}

export async function GET(_request: Request, context: SessionRouteContext): Promise<Response> {
  return suggestionsResponse(context);
}

// POST is used when the user explicitly asks for another dynamically generated set.
export async function POST(_request: Request, context: SessionRouteContext): Promise<Response> {
  return suggestionsResponse(context);
}
