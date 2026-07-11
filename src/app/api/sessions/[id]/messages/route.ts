import { NextResponse } from "next/server";

import { AnswerInputSchema } from "@/lib/domain/schemas";
import {
  apiErrorResponse,
  readJson,
  type SessionRouteContext,
  sessionIdFrom,
} from "@/lib/server/http";
import { getMirrorSessionService } from "@/lib/server/session-service";

export const runtime = "nodejs";

export async function POST(request: Request, context: SessionRouteContext): Promise<Response> {
  try {
    const id = await sessionIdFrom(context);
    const input = await readJson(request, AnswerInputSchema);
    const session = await getMirrorSessionService().answer(id, input.message);
    const latestMirrorMessage = session.messages.findLast((message) => message.role === "mirror");
    return NextResponse.json({
      sessionId: session.id,
      session,
      stage: session.stage,
      message: latestMirrorMessage?.content ?? "",
      turnCount: session.questionIndex,
      resultReady: session.result !== undefined,
      riskFlags: session.riskFlags,
    });
  } catch (error: unknown) {
    return apiErrorResponse(error);
  }
}
