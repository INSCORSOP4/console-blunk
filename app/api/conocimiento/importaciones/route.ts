import type { NextRequest } from "next/server";
import { apiBase, problem } from "@/lib/auth/server";
import { hasLiveSession, isSameOrigin, SESSION_COOKIE } from "@/lib/auth/session";

// Subida de notas: reenvía el multipart tal cual a la API (en flujo, sin cargarlo en memoria) con el token de la cookie.
// Está fuera de proxy.ts (que solo bufferiza 10 MB), así que aquí se valida la sesión y el origen.
const MAX_BYTES = 60 * 1024 * 1024; // mismo tope que la API

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return problem(403, "Origen no permitido.");

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!hasLiveSession(token)) return problem(401, "Inicia sesión para continuar.");

  const base = apiBase();
  if (!base) return problem(500, "Falta configurar API_URL en el servidor.");

  const tipo = request.headers.get("content-type") ?? "";
  if (!tipo.toLowerCase().startsWith("multipart/form-data")) {
    return problem(400, "La subida debe enviarse como multipart/form-data.");
  }
  const largo = Number(request.headers.get("content-length"));
  if (!Number.isFinite(largo) || largo <= 0) return problem(411, "Falta el tamaño de la subida.");
  if (largo > MAX_BYTES) return problem(413, "La subida supera el máximo de 60 MB.");

  let upstream: Response;
  try {
    upstream = await fetch(`${base}/v1/conocimiento/importaciones`, {
      method: "POST",
      headers: {
        "content-type": tipo,
        "content-length": String(largo),
        authorization: `Bearer ${token}`,
        accept: "application/json",
      },
      body: request.body,
      // Necesario para enviar un cuerpo en flujo con fetch en Node.
      duplex: "half",
      cache: "no-store",
      signal: AbortSignal.timeout(180_000),
    } as RequestInit & { duplex: "half" });
  } catch {
    return problem(502, "No se pudo conectar con la API de soporte.");
  }

  // La respuesta (informe o problema) se devuelve tal cual; si la sesión venció, el cliente va al login.
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
