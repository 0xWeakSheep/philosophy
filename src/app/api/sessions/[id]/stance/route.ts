import { UpdateStanceInputSchema } from "@/lib/domain/schemas";
import {
  apiErrorResponse,
  readJson,
  type SessionRouteContext,
  sessionIdFrom,
  sessionResponse,
} from "@/lib/server/http";
import { getMirrorSessionService } from "@/lib/server/session-service";

export const runtime = "nodejs";

export async function POST(request: Request, context: SessionRouteContext): Promise<Response> {
  try {
    const id = await sessionIdFrom(context);
    const input = await readJson(request, UpdateStanceInputSchema);
    const session = await getMirrorSessionService().updateStance(
      id,
      input.hypothesisId,
      input.stance,
      input.note,
    );
    return sessionResponse(session);
  } catch (error: unknown) {
    return apiErrorResponse(error);
  }
}
