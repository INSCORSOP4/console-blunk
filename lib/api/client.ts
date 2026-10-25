import type { z } from "zod";
import { problemSchema } from "./schemas";

/** Ruta del proxy interno de Next (ver app/api/proxy). El navegador nunca habla directo con la API. */
export const PROXY_BASE = "/api/proxy/v1";

/** Sesión vencida o ausente: se vuelve al login y luego a la página que se estaba viendo. */
function redirectToLogin() {
  if (typeof window === "undefined" || window.location.pathname.startsWith("/login")) return;
  const next = `${window.location.pathname}${window.location.search}`;
  // Navegación completa a propósito: reinicia la memoria de la app y la sesión del navegador.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/login?next=${encodeURIComponent(next)}`);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type Params = Record<string, string | number | boolean | null | undefined>;

export function buildQuery(params?: Params): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    qs.set(key, String(value));
  }
  const text = qs.toString();
  return text ? `?${text}` : "";
}

export function exportUrl(params?: Params): string {
  return `${PROXY_BASE}/tickets/export${buildQuery(params)}`;
}

export async function apiGet<S extends z.ZodType>(
  path: string,
  schema: S,
  params?: Params,
  signal?: AbortSignal,
): Promise<z.infer<S>> {
  let response: Response;
  try {
    response = await fetch(`${PROXY_BASE}/${path}${buildQuery(params)}`, { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("No se pudo contactar al servidor.", 0);
  }

  if (!response.ok) {
    if (response.status === 401) redirectToLogin();
    const parsed = problemSchema.safeParse(await response.json().catch(() => null));
    const problem = parsed.success ? parsed.data : undefined;
    const detail =
      problem?.detail ??
      (problem?.errors ? Object.values(problem.errors).flat().join(" ") : undefined) ??
      problem?.title;
    throw new ApiError(detail ?? `Error ${response.status}`, response.status);
  }

  const result = schema.safeParse(await response.json());
  if (!result.success) {
    // Contrato roto entre API y frontend: mejor fallar claro que mostrar datos erróneos.
    throw new ApiError("La respuesta del servidor no tiene el formato esperado.", 502);
  }
  return result.data;
}
