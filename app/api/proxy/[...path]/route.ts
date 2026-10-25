import type { NextRequest } from "next/server";
import { apiBase, clearSessionCookie, problem } from "@/lib/auth/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

// Proxy de solo lectura hacia la API de soporte. Mantiene la URL interna y el token fuera del navegador:
// el token vive en una cookie HttpOnly y aquí se convierte en la cabecera Authorization.
// Solo reenvía GET a prefijos conocidos.
const ALLOWED_AREAS = new Set([
  "dashboard",
  "tickets",
  "tecnicos",
  "catalogos",
  "conocimiento",
  "utilerias",
  "bitacora",
  "auditoria",
]);
const SEGMENT = /^[A-Za-z0-9_-]+$/;
const FORWARDED_HEADERS = ["content-type", "content-disposition", "x-export-truncated"];

export async function GET(request: NextRequest, ctx: RouteContext<"/api/proxy/[...path]">) {
  const base = apiBase();
  if (!base) return problem(500, "Falta configurar API_URL en el servidor.");

  const { path } = await ctx.params;
  const [version, area] = path;
  if (
    version !== "v1" ||
    !area ||
    !ALLOWED_AREAS.has(area) ||
    !path.every((s) => SEGMENT.test(s))
  ) {
    return problem(404, "Ruta no permitida.");
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return problem(401, "Inicia sesión para continuar.");

  const target = new URL(`${base}/${path.join("/")}`);
  target.search = request.nextUrl.search;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
      headers: {
        accept: request.headers.get("accept") ?? "application/json",
        authorization: `Bearer ${token}`,
      },
    });
  } catch {
    return problem(502, "No se pudo conectar con la API de soporte.");
  }

  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("cache-control", "no-store");
  const response = new Response(upstream.body, { status: upstream.status, headers });

  // Sesión vencida o sin permiso: se borra la cookie para que el siguiente acceso pida login.
  if (upstream.status === 401) {
    const cleared = problem(401, "Tu sesión expiró. Inicia sesión de nuevo.");
    clearSessionCookie(cleared);
    return cleared;
  }
  return response;
}
