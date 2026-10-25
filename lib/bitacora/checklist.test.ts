import { describe, expect, it } from "vitest";
import type { EstadoChecklist, ItemChecklist, ResumenDia } from "@/lib/api/bitacora-schemas";
import {
  contarChecklist,
  estaCompleto,
  incidenciasDelDia,
  peorEstadoDia,
  requiereObservacion,
  revisoresDelDia,
} from "./checklist";

const item = (
  estado: EstadoChecklist | null,
  extra: Partial<ItemChecklist> = {},
): ItemChecklist => ({
  actividadId: 1,
  nombre: "x",
  orden: 1,
  actividadActiva: true,
  estado,
  observacion: null,
  revisadoPor: null,
  revisadoEn: null,
  actualizadoPor: null,
  actualizadoEn: null,
  ...extra,
});

describe("requiereObservacion", () => {
  it("solo Advertencia, Falla y Crítico la piden", () => {
    expect(requiereObservacion("Advertencia")).toBe(true);
    expect(requiereObservacion("Falla")).toBe(true);
    expect(requiereObservacion("Critico")).toBe(true);
    expect(requiereObservacion("Ok")).toBe(false);
    expect(requiereObservacion("NoAplica")).toBe(false);
  });
});

describe("contarChecklist / estaCompleto", () => {
  it("cuenta cada estado, incluidos los pendientes (estado null)", () => {
    const items = [
      item("Ok"),
      item("Ok"),
      item("Falla"),
      item("Critico"),
      item("NoAplica"),
      item(null),
    ];
    expect(contarChecklist(items)).toEqual({
      ok: 2,
      advertencia: 0,
      falla: 1,
      critico: 1,
      noAplica: 1,
      pendiente: 1,
      total: 6,
    });
  });

  it("está completo solo cuando nada quedó pendiente, y una lista vacía no cuenta como completa", () => {
    expect(estaCompleto([item("Ok"), item("NoAplica")])).toBe(true);
    expect(estaCompleto([item("Ok"), item(null)])).toBe(false);
    expect(estaCompleto([])).toBe(false);
  });
});

describe("revisoresDelDia", () => {
  it("toma actualizadoPor si existe, si no revisadoPor, sin repetir nombres", () => {
    const items = [
      item("Ok", { revisadoPor: "Javier" }),
      item("Falla", { revisadoPor: "Javier", actualizadoPor: "Karla", observacion: "x" }),
      item("Ok", { revisadoPor: "Julio" }),
      item(null),
    ];
    expect(revisoresDelDia(items)).toEqual(["Javier", "Karla", "Julio"]);
  });

  it("sin revisiones no hay nadie", () => {
    expect(revisoresDelDia([item(null), item(null)])).toEqual([]);
  });
});

describe("incidenciasDelDia", () => {
  it("solo Advertencia, Falla y Crítico cuentan como incidencia", () => {
    const items = [
      item("Ok"),
      item("Advertencia", { observacion: "a" }),
      item("Falla", { observacion: "b" }),
      item("Critico", { observacion: "c" }),
      item("NoAplica"),
      item(null),
    ];
    expect(incidenciasDelDia(items).map((i) => i.observacion)).toEqual(["a", "b", "c"]);
  });

  it("sin incidencias devuelve una lista vacía", () => {
    expect(incidenciasDelDia([item("Ok"), item("NoAplica")])).toEqual([]);
  });
});

describe("peorEstadoDia", () => {
  const r = (parcial: Partial<ResumenDia>): ResumenDia => ({
    fecha: "2026-10-09",
    ok: 0,
    advertencia: 0,
    falla: 0,
    critico: 0,
    noAplica: 0,
    pendiente: 0,
    total: 0,
    ...parcial,
  });

  it("prioriza crítico sobre falla, advertencia, pendiente y ok", () => {
    expect(
      peorEstadoDia(r({ ok: 5, pendiente: 2, advertencia: 1, falla: 1, critico: 1, total: 10 })),
    ).toBe("critico");
    expect(peorEstadoDia(r({ ok: 5, pendiente: 2, advertencia: 1, falla: 1, total: 9 }))).toBe(
      "falla",
    );
    expect(peorEstadoDia(r({ ok: 5, pendiente: 2, advertencia: 1, total: 8 }))).toBe("advertencia");
    expect(peorEstadoDia(r({ ok: 5, pendiente: 2, total: 7 }))).toBe("pendiente");
    expect(peorEstadoDia(r({ ok: 5, noAplica: 2, total: 7 }))).toBe("ok");
    expect(peorEstadoDia(r({ noAplica: 3, total: 3 }))).toBe("noAplica");
  });

  it("un día sin ninguna actividad (total 0) queda 'vacio'", () => {
    expect(peorEstadoDia(r({}))).toBe("vacio");
  });
});
