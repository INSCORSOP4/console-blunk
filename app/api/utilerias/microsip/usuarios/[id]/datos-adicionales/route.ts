import type { NextRequest } from "next/server";
import { apiBase, problem } from "@/lib/auth/server";
import { hasLiveSession, isSameOrigin, SESSION_COOKIE } from "@/lib/auth/session";

// Guardar la clave de FORTIA de un usuario de MICROSIP. Es la única escritura de la consola sobre MICROSIP:
// aquí se valida el origen, la sesión y la forma de la petición; la API vuelve a validar el token, el rol y todo lo demás.
export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/utilerias/microsip/usuarios/[id]/datos-adicionales">,
) {
  if (!isSameOrigin(request)) return problem(403, "Origen no permitido.");

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!hasLiveSession(token)) return problem(401, "Inicia sesión para continuar.");

  const base = apiBase();
  if (!base) return problem(500, "Falta configurar API_URL en el servidor.");

  const { id } = await ctx.params;
  if (!/^\d{1,9}$/.test(id) || Number(id) <= 0) return problem(400, "Usuario no válido.");

  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return problem(400, "La petición debe ser JSON.");
  }
  const texto = await request.text();
  if (texto.length > 200) return problem(413, "Petición demasiado grande.");

  let clave: unknown;
  try {
    clave = (JSON.parse(texto) as { claveFortia?: unknown }).claveFortia;
  } catch {
    return problem(400, "JSON no válido.");
  }
  if (
    typeof clave !== "number" ||
    !Number.isInteger(clave) ||
    clave <= 0 ||
    clave > 2_000_000_000
  ) {
    return problem(400, "La clave de FORTIA debe ser un número entero positivo.");
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${base}/v1/utilerias/microsip/usuarios/${id}/datos-adicionales`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        accept: "application/json",
      },
      body: JSON.stringify({ claveFortia: clave }),
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    return problem(502, "No se pudo conectar con la API de soporte.");
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
      ...(upstream.headers.get("retry-after")
        ? { "retry-after": upstream.headers.get("retry-after")! }
        : {}),
    },
  });
}
