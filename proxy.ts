import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasLiveSession, safeNext, SESSION_COOKIE } from "@/lib/auth/session";

// Guardia de acceso: toda página exige sesión salvo /login. Aquí solo se comprueba que exista una cookie con un
// token vigente (no se verifica la firma); la API valida la firma y el rol en cada petición.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const live = hasLiveSession(request.cookies.get(SESSION_COOKIE)?.value);

  // Las rutas de autenticación son públicas (el login y el cierre de sesión validan por su cuenta).
  if (pathname.startsWith("/api/auth/")) return NextResponse.next();

  // Las llamadas de datos responden 401 en JSON en lugar de redirigir.
  if (pathname.startsWith("/api/")) {
    return live
      ? NextResponse.next()
      : NextResponse.json({ title: "Inicia sesión para continuar.", status: 401 }, { status: 401 });
  }

  if (pathname === "/login") {
    if (!live) return NextResponse.next();
    return NextResponse.redirect(
      new URL(safeNext(request.nextUrl.searchParams.get("next")), request.url),
    );
  }

  if (!live) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Todo menos archivos estáticos de Next, la marca, la mascota y el icono.
  // api/conocimiento/importaciones se excluye porque proxy.ts clona y bufferiza el cuerpo (máx. 10 MB) y las subidas
  // son de hasta 60 MB; esa ruta valida la sesión por su cuenta y la API vuelve a validar el token.
  matcher: [
    "/((?!_next/static|_next/image|brand/|mascota/|icon.png|favicon.ico|api/conocimiento/importaciones$).*)",
  ],
};
