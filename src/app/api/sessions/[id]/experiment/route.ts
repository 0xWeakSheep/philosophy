import { NextResponse } from "next/server";

import { CreateExperimentInputSchema } from "@/lib/domain/schemas";
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
    const input = await readJson(request, CreateExperimentInputSchema);
    const created = await getMirrorSessionService().experiment(id, input.dimension);
    return NextResponse.json({
      sessionId: id,
      experiment: created.experiment,
      session: created.session,
    });
  } catch (error: unknown) {
    return apiErrorResponse(error);
  }
}
