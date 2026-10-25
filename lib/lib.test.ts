import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError, apiGet, buildQuery, exportUrl } from "@/lib/api/client";
import { resumenSchema } from "@/lib/api/schemas";
import { fmtFecha, fmtHoras, fmtPct, horasDesde, restarDias, restarMeses } from "@/lib/format";
import { agrupacionDe, rangoDe } from "@/lib/rangos";

describe("format", () => {
  it("fmtHoras usa la unidad adecuada", () => {
    expect(fmtHoras(null)).toBe("—");
    expect(fmtHoras(0.5)).toBe("30 min");
    expect(fmtHoras(0.001)).toBe("1 min");
    expect(fmtHoras(8.25)).toBe("8.3 h");
    expect(fmtHoras(72)).toBe("3.0 d");
  });

  it("horasDesde calcula contra la fecha dada, sin importar el offset de la fecha ISO", () => {
    const ahora = new Date("2026-10-10T12:00:00Z");
    expect(horasDesde("2026-10-10T08:00:00Z", ahora)).toBeCloseTo(4, 5);
    expect(horasDesde("2026-10-10T02:00:00-06:00", ahora)).toBeCloseTo(4, 5); // mismo instante, otro offset
    expect(horasDesde("2026-10-10T13:00:00Z", ahora)).toBeCloseTo(-1, 5); // fecha futura
  });

  it("fmtPct respeta decimales", () => {
    expect(fmtPct(98.617)).toBe("98.6%");
    expect(fmtPct(98.617, 0)).toBe("99%");
  });

  it("fmtFecha muestra la hora de México aunque llegue con otro offset", () => {
    expect(fmtFecha("2026-10-05T21:56:49Z", "yyyy-MM-dd HH:mm")).toBe("2026-10-05 15:56");
    expect(fmtFecha("2026-10-05T15:56:49-06:00", "HH:mm")).toBe("15:56");
    expect(fmtFecha(null)).toBe("—");
  });

  it("resta días y meses sin saltos de zona", () => {
    expect(restarDias("2026-03-01", 1)).toBe("2026-02-28");
    expect(restarMeses("2026-10-05", 12)).toBe("2025-10-05");
  });
});

describe("rangos", () => {
  it("'todo' no limita fechas y los demás sí", () => {
    expect(rangoDe("todo")).toEqual({});
    const r = rangoDe("7d");
    expect(r.desde && r.hasta).toBeTruthy();
    expect(restarDias(r.hasta!, 6)).toBe(r.desde);
  });

  it("agrupa por mes los periodos largos", () => {
    expect(agrupacionDe("30d")).toBe("Dia");
    expect(agrupacionDe("90d")).toBe("Semana");
    expect(agrupacionDe("12m")).toBe("Mes");
  });
});

describe("client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("buildQuery omite vacíos y codifica valores", () => {
    expect(buildQuery({ a: "x y", b: "", c: undefined, d: null, e: 0, f: false })).toBe(
      "?a=x+y&e=0&f=false",
    );
    expect(buildQuery({})).toBe("");
    expect(exportUrl({ desde: "2026-01-01" })).toBe(
      "/api/proxy/v1/tickets/export?desde=2026-01-01",
    );
  });

  it("convierte un ProblemDetails en ApiError con su detalle", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ title: "No encontrado", detail: "No existe el ticket" }, { status: 404 }),
        ),
    );
    const error = await apiGet("tickets/1", z.object({})).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, message: "No existe el ticket" });
  });

  it("une los errores de validación cuando no hay detalle", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { title: "Parámetros inválidos", errors: { Page: ["Muy grande"] } },
            { status: 400 },
          ),
        ),
    );
    await expect(apiGet("tickets", z.object({}))).rejects.toMatchObject({
      status: 400,
      message: "Muy grande",
    });
  });

  it("falla con 0 si no hay red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));
    await expect(apiGet("x", z.object({}))).rejects.toMatchObject({ status: 0 });
  });

  it("rechaza respuestas que no cumplen el contrato", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ total: "muchos" })));
    await expect(apiGet("dashboard/resumen", resumenSchema)).rejects.toMatchObject({ status: 502 });
  });

  it("devuelve los datos tipados cuando el contrato se cumple", async () => {
    const body = {
      total: 10,
      abiertos: 4,
      cerrados: 6,
      vencidos: 1,
      creadosHoy: 2,
      cerradosHoy: 1,
      sinAsignar: 0,
      promedioHorasResolucion: null,
      porEstado: [{ id: 1, nombre: "Open", total: 4 }],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)));
    await expect(apiGet("dashboard/resumen", resumenSchema)).resolves.toEqual(body);
  });
});
