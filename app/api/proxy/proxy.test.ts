import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./[...path]/route";

const call = (path: string[], search = "", cookie: string | null = "sb_session=jwt-de-prueba") =>
  GET(
    new NextRequest(`http://localhost:3000/api/proxy/${path.join("/")}${search}`, {
      headers: cookie ? { cookie } : {},
    }),
    { params: Promise.resolve({ path }) } as never,
  );

describe("proxy de solo lectura", () => {
  beforeEach(() => {
    process.env.API_URL = "http://api.interna:5138/";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.API_URL;
  });

  it("reenvía rutas permitidas con su query string y el token de la cookie como Bearer", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await call(["v1", "tickets", "123"], "?x=1");

    expect(res.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://api.interna:5138/v1/tickets/123?x=1");
    expect(fetchMock.mock.calls[0][1].headers.authorization).toBe("Bearer jwt-de-prueba");
  });

  it("sin cookie de sesión responde 401 sin llamar a la API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await call(["v1", "tickets"], "", null);

    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("si la API rechaza el token (401), responde 401 y borra la cookie", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 401 })));

    const res = await call(["v1", "tickets"]);

    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toMatch(/sb_session=;.*Max-Age=0/i);
  });

  it("no reenvía al navegador ninguna cabecera Set-Cookie de la API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("{}", {
          status: 200,
          headers: { "set-cookie": "x=y", "content-type": "application/json" },
        }),
      ),
    );

    const res = await call(["v1", "tickets"]);

    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it.each([
    [["v1", "health"]],
    [["v1", "auth", "me"]],
    [["v2", "tickets"]],
    [["v1", "tickets", ".."]],
    [["v1", "tickets", "a b"]],
    [["admin"]],
  ])("rechaza %j sin llamar a la API", async (path) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await call(path);

    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("responde 500 si falta API_URL", async () => {
    delete process.env.API_URL;
    expect((await call(["v1", "tickets"])).status).toBe(500);
  });

  it("responde 502 si la API no está disponible", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    expect((await call(["v1", "tickets"])).status).toBe(502);
  });

  it("conserva el estado y las cabeceras de descarga de la API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("xlsx", {
          status: 200,
          headers: {
            "content-disposition": "attachment; filename=t.xlsx",
            "x-export-truncated": "false",
          },
        }),
      ),
    );

    const res = await call(["v1", "tickets", "export"]);

    expect(res.headers.get("content-disposition")).toContain("t.xlsx");
    expect(res.headers.get("x-export-truncated")).toBe("false");
  });
});
