import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET(): Response {
  return NextResponse.json({ status: "ok", engine: "mirror-room" });
}
