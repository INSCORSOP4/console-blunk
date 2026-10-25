import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiBase, clearSessionCookie, problem } from "@/lib/auth/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return problem(401, "No hay sesión.");

  const base = apiBase();
  if (!base) return problem(500, "Falta configurar API_URL en el servidor.");

  let upstream: Response;
  try {
    upstream = await fetch(`${base}/v1/auth/me`, {
      headers: { authorization: `Bearer ${token}`, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return problem(502, "No se pudo conectar con la API de soporte.");
  }

  if (upstream.status === 401 || upstream.status === 403) {
    const response = problem(401, "La sesión expiró.");
    clearSessionCookie(response);
    return response;
  }
  if (!upstream.ok) return problem(502, "No se pudo consultar la sesión.");

  return NextResponse.json(await upstream.json(), { headers: { "cache-control": "no-store" } });
}
