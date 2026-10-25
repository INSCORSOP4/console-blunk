import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiBase, problem, setSessionCookie } from "@/lib/auth/server";
import { isSameOrigin } from "@/lib/auth/session";

const bodySchema = z.object({
  email: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

const upstreamSchema = z.object({
  token: z.string().min(20),
  expiraEn: z.string(),
  usuario: z.object({ id: z.string(), nombre: z.string(), email: z.string() }),
});

// Solo se reenvían al navegador los errores que son del usuario; los de infraestructura se resumen.
const USER_ERRORS = new Set([400, 401, 403, 429]);

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return problem(403, "Origen no permitido.");

  const base = apiBase();
  if (!base) return problem(500, "Falta configurar API_URL en el servidor.");

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return problem(400, "Escribe tu correo y tu contraseña.");

  let upstream: Response;
  try {
    upstream = await fetch(`${base}/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return problem(502, "No se pudo conectar con la API de soporte.");
  }

  const data: unknown = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    if (USER_ERRORS.has(upstream.status)) {
      const detail = (data as { detail?: unknown } | null)?.detail;
      const retryAfter = upstream.headers.get("retry-after");
      return problem(
        upstream.status,
        "No se pudo iniciar sesión",
        typeof detail === "string" ? detail : undefined,
        retryAfter ? { "retry-after": retryAfter } : undefined,
      );
    }
    return problem(
      upstream.status === 503 ? 503 : 502,
      "El servicio de autenticación no está disponible.",
    );
  }

  const session = upstreamSchema.safeParse(data);
  const expires = session.success ? new Date(session.data.expiraEn) : null;
  if (!session.success || !expires || Number.isNaN(expires.getTime())) {
    return problem(502, "La API devolvió una sesión con formato inesperado.");
  }

  // El token vive solo en la cookie HttpOnly; al navegador solo se le devuelve el usuario.
  const response = NextResponse.json(
    { usuario: session.data.usuario },
    { headers: { "cache-control": "no-store" } },
  );
  setSessionCookie(response, session.data.token, expires);
  return response;
}
