import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { proxy } from "@/proxy";
import { hasLiveSession, isSameOrigin, readExpiry, safeNext } from "./session";

/** JWT de prueba (sin firma válida; el frontend solo lee `exp`). */
const jwt = (exp: number) =>
  `${btoa('{"alg":"HS256"}')}.${btoa(JSON.stringify({ exp })).replace(/=+$/, "")}.firma`;
const ahora = Math.floor(Date.now() / 1000);

describe("sesión", () => {
  it("lee la expiración del token y rechaza lo que no es un JWT", () => {
    expect(readExpiry(jwt(1234))).toBe(1234);
    expect(readExpiry(undefined)).toBeNull();
    expect(readExpiry("abc")).toBeNull();
    expect(readExpiry("a.%%%.c")).toBeNull();
    expect(readExpiry(`a.${btoa('{"sin":"exp"}')}.c`)).toBeNull();
  });

  it("solo hay sesión viva si el token no ha expirado", () => {
    expect(hasLiveSession(jwt(ahora + 3600))).toBe(true);
    expect(hasLiveSession(jwt(ahora - 5))).toBe(false);
    expect(hasLiveSession(jwt(ahora + 3))).toBe(false); // dentro del margen de 10 s
    expect(hasLiveSession(undefined)).toBe(false);
  });

  it.each([
    ["/tickets?estado=3", "/tickets?estado=3"],
    ["/tickets/16506", "/tickets/16506"],
    ["//evil.example.com", "/dashboard"],
    ["https://evil.example.com", "/dashboard"],
    ["/\\evil.example.com", "/dashboard"],
    ["/login", "/dashboard"],
    ["/api/auth/me", "/dashboard"],
    ["", "/dashboard"],
    [null, "/dashboard"],
  ])("safeNext(%j) -> %s", (entrada, esperado) => {
    expect(safeNext(entrada)).toBe(esperado);
  });

  it("isSameOrigin compara el Origin con el host de la petición", () => {
    const req = (headers: Record<string, string>) =>
      new Request("http://localhost:3000/x", { headers });
    expect(isSameOrigin(req({ origin: "http://localhost:3000", host: "localhost:3000" }))).toBe(
      true,
    );
    expect(isSameOrigin(req({ origin: "https://evil.example.com", host: "localhost:3000" }))).toBe(
      false,
    );
    expect(isSameOrigin(req({ origin: "basura", host: "localhost:3000" }))).toBe(false);
    expect(isSameOrigin(req({ host: "localhost:3000" }))).toBe(true);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    process.env.API_URL = "http://api.interna:5138";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.API_URL;
  });

  const post = (body: unknown, headers: Record<string, string> = {}) =>
    login(
      new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json", host: "localhost:3000", ...headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
      }),
    );

  const exito = () =>
    Response.json({
      token: "x".repeat(40),
      expiraEn: new Date(Date.now() + 8 * 3600_000).toISOString(),
      usuario: { id: "1", nombre: "Ana", email: "ana@prosur.com.mx" },
    });

  it("guarda el token SOLO en una cookie HttpOnly y no lo devuelve en el cuerpo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(exito()));

    const res = await post({ email: "ana@prosur.com.mx", password: "pw" });
    const texto = await res.text();

    expect(res.status).toBe(200);
    expect(texto).not.toContain("x".repeat(40));
    expect(JSON.parse(texto).usuario.nombre).toBe("Ana");
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/sb_session=x{40}/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
  });

  it("reenvía credenciales incorrectas, acceso denegado y bloqueo con su Retry-After", async () => {
    const problem = (status: number, detail: string, headers: HeadersInit = {}) =>
      Response.json({ title: "t", status, detail }, { status, headers });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(problem(401, "Correo o contraseña incorrectos.")),
    );
    let res = await post({ email: "a@b.mx", password: "x" });
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(problem(403, "Tu usuario no tiene acceso a esta consola.")),
    );
    res = await post({ email: "a@b.mx", password: "x" });
    expect(res.status).toBe(403);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(problem(429, "Demasiados intentos.", { "retry-after": "900" })),
    );
    res = await post({ email: "a@b.mx", password: "x" });
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("900");
  });

  it("no filtra errores internos de la API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Stack trace secreto", { status: 500 })),
    );
    const res = await post({ email: "a@b.mx", password: "x" });
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain("secreto");
  });

  it("responde 502 si no puede conectar con la API", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    expect((await post({ email: "a@b.mx", password: "x" })).status).toBe(502);
  });

  it.each([[{}], [{ email: "", password: "x" }], [{ email: "a@b.mx" }], ["no es json"]])(
    "rechaza cuerpos inválidos (%j) sin llamar a la API",
    async (body) => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      expect((await post(body)).status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("rechaza un Origin ajeno (CSRF) sin llamar a la API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await post(
      { email: "a@b.mx", password: "x" },
      { origin: "https://evil.example.com" },
    );
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/logout", () => {
  it("borra la cookie de sesión", async () => {
    const res = await logout(
      new NextRequest("http://localhost:3000/api/auth/logout", {
        method: "POST",
        headers: { host: "localhost:3000" },
      }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/sb_session=;.*Max-Age=0/i);
  });
});

describe("guardia de acceso (proxy.ts)", () => {
  const req = (path: string, cookie?: string) =>
    new NextRequest(`http://localhost:3000${path}`, { headers: cookie ? { cookie } : {} });
  const viva = `sb_session=${jwt(ahora + 3600)}`;
  const vencida = `sb_session=${jwt(ahora - 60)}`;

  it("sin sesión redirige a /login conservando la página pedida", () => {
    const res = proxy(req("/tickets?estado=3"));
    expect(res.status).toBe(307);
    const destino = new URL(res.headers.get("location")!);
    expect(destino.pathname).toBe("/login");
    expect(destino.searchParams.get("next")).toBe("/tickets?estado=3");
  });

  it("con sesión vencida también redirige", () => {
    expect(proxy(req("/dashboard", vencida)).status).toBe(307);
  });

  it("con sesión viva deja pasar las páginas", () => {
    expect(proxy(req("/dashboard", viva)).headers.get("location")).toBeNull();
  });

  it("/login es público, pero con sesión viva manda al tablero (sin redirección abierta)", () => {
    expect(proxy(req("/login")).headers.get("location")).toBeNull();
    const conSesion = proxy(req("/login?next=//evil.example.com", viva));
    expect(new URL(conSesion.headers.get("location")!).pathname).toBe("/dashboard");
  });

  it("las llamadas a /api/* sin sesión responden 401 JSON (no redirigen); /api/auth/* es público", async () => {
    const res = proxy(req("/api/proxy/v1/tickets"));
    expect(res.status).toBe(401);
    expect(res.headers.get("location")).toBeNull();
    expect(proxy(req("/api/auth/login")).status).toBe(200);
  });
});
