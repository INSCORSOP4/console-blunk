import type { NextRequest } from "next/server";
import { apiBase, problem } from "@/lib/auth/server";
import { hasLiveSession, isSameOrigin, SESSION_COOKIE } from "@/lib/auth/session";

type Opciones = {
  metodo: "POST" | "PUT";
  /** Ruta relativa de la API, por ejemplo "bitacora/actividades/7" (puede incluir query string). */
  destino: string;
  maxBytes: number;
  /** Validación mínima de forma del cuerpo antes de reenviarlo; la API vuelve a validar todo. */
  valido: (cuerpo: unknown) => boolean;
};

/**
 * Reenvía una escritura pequeña (JSON) de la consola hacia la API, con las mismas comprobaciones en cada ruta:
 * mismo origen, sesión viva, tamaño acotado y forma básica del cuerpo. Usado por las rutas de escritura de
 * la bitácora (y es el mismo patrón que ya usan las de MICROSIP).
 */
export async function reenviarEscritura(
  request: NextRequest,
  opciones: Opciones,
): Promise<Response> {
  if (!isSameOrigin(request)) return problem(403, "Origen no permitido.");

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!hasLiveSession(token)) return problem(401, "Inicia sesión para continuar.");

  const base = apiBase();
  if (!base) return problem(500, "Falta configurar API_URL en el servidor.");

  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return problem(400, "La petición debe ser JSON.");
  }
  const texto = await request.text();
  if (texto.length > opciones.maxBytes) return problem(413, "Petición demasiado grande.");

  let cuerpo: unknown;
  try {
    cuerpo = JSON.parse(texto);
  } catch {
    return problem(400, "JSON no válido.");
  }
  if (!opciones.valido(cuerpo))
    return problem(400, "El cuerpo de la petición no tiene el formato esperado.");

  let upstream: Response;
  try {
    upstream = await fetch(`${base}/v1/${opciones.destino}`, {
      method: opciones.metodo,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        accept: "application/json",
      },
      body: texto,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
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
