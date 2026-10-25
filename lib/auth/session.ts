/** Nombre de la cookie de sesión (HttpOnly: JavaScript del navegador nunca ve el token). */
export const SESSION_COOKIE = "sb_session";

/** Lee la expiración (`exp`, en segundos) del payload de un JWT SIN verificar la firma. Solo sirve para decidir
 *  si redirigir al login; la verificación real la hace la API en cada petición. */
export function readExpiry(token: string | undefined): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

/** true si hay un token con expiración futura (margen de 10 s). */
export function hasLiveSession(token: string | undefined, nowMs = Date.now()): boolean {
  const exp = readExpiry(token);
  return exp !== null && exp * 1000 > nowMs + 10_000;
}

/** Ruta interna segura para volver tras iniciar sesión (evita redirecciones abiertas a otros sitios). */
export function safeNext(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\"))
    return fallback;
  if (value.startsWith("/login") || value.startsWith("/api/")) return fallback;
  return value;
}

/** Atributos de la cookie. `Secure` se activa en producción; puede forzarse con COOKIE_SECURE=true|false. */
export function cookieSecure(): boolean {
  const forced = process.env.COOKIE_SECURE;
  if (forced === "true") return true;
  if (forced === "false") return false;
  return process.env.NODE_ENV === "production";
}

/** Rechaza peticiones de escritura que no vengan de esta misma página (defensa CSRF adicional a SameSite). */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // llamadas del mismo servidor / herramientas sin cabecera Origin
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
