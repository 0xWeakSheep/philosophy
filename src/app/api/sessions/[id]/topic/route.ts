import { ConfirmTopicInputSchema } from "@/lib/domain/schemas";
import {
  apiErrorResponse,
  readJson,
  type SessionRouteContext,
  sessionIdFrom,
  sessionResponse,
} from "@/lib/server/http";
import { getMirrorSessionService } from "@/lib/server/session-service";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: SessionRouteContext): Promise<Response> {
  try {
    const id = await sessionIdFrom(context);
    const input = await readJson(request, ConfirmTopicInputSchema);
    const session = await getMirrorSessionService().confirmTopic(id, input.topic);
    return sessionResponse(session);
  } catch (error: unknown) {
    return apiErrorResponse(error);
  }
}
