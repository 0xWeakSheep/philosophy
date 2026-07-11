import { CreateSessionInputSchema } from "@/lib/domain/schemas";
import { apiErrorResponse, readJson, sessionResponse } from "@/lib/server/http";
import { getMirrorSessionService } from "@/lib/server/session-service";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const input = await readJson(request, CreateSessionInputSchema);
    const session = await getMirrorSessionService().create(input.input);
    return sessionResponse(session, 201);
  } catch (error: unknown) {
    return apiErrorResponse(error);
  }
}
