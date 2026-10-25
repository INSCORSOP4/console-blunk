import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clearSessionCookie, problem } from "@/lib/auth/server";
import { isSameOrigin } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return problem(403, "Origen no permitido.");
  // La sesión es un JWT sin estado en servidor: cerrar sesión = borrar la cookie.
  const response = NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  clearSessionCookie(response);
  return response;
}
