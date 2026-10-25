import { describe, expect, it } from "vitest";
import { hoyMx } from "@/lib/format";
import {
  avanzar,
  esFechaActual,
  fechaActual,
  fechaDesdeEntrada,
  formatearEncabezado,
  valorDeEntrada,
} from "./fecha";
import type { ConfigBitacora } from "./grupos";

const base: ConfigBitacora = {
  grupo: "x",
  rutaBase: "/bitacora/x",
  titulo: "X",
  descripcion: "",
  nombreSingular: "x",
  nombrePlural: "x",
  genero: "m",
  granularidad: "dia",
};
const diaria = base;
const mensual: ConfigBitacora = { ...base, granularidad: "mes" };

describe("fechaActual / esFechaActual", () => {
  it("diaria es hoy; mensual es el día 1 del mes en curso", () => {
    expect(fechaActual(diaria)).toBe(hoyMx());
    expect(fechaActual(mensual)).toBe(`${hoyMx().slice(0, 7)}-01`);
  });

  it("detecta si una fecha es la actual de esa bitácora", () => {
    expect(esFechaActual(diaria, hoyMx())).toBe(true);
    expect(esFechaActual(diaria, "2020-01-01")).toBe(false);
    expect(esFechaActual(mensual, `${hoyMx().slice(0, 7)}-01`)).toBe(true);
    expect(esFechaActual(mensual, "2020-01-01")).toBe(false);
  });
});

describe("avanzar", () => {
  it("diaria se mueve un día", () => {
    expect(avanzar(diaria, "2026-03-15", -1)).toBe("2026-03-14");
    expect(avanzar(diaria, "2026-03-15", 1)).toBe("2026-03-16");
  });

  it("mensual se mueve un mes completo, siempre al día 1", () => {
    expect(avanzar(mensual, "2026-03-01", -1)).toBe("2026-02-01");
    expect(avanzar(mensual, "2026-03-01", 1)).toBe("2026-04-01");
    expect(avanzar(mensual, "2026-01-01", -1)).toBe("2025-12-01");
  });
});

describe("entrada del <input>", () => {
  it("diaria usa yyyy-MM-dd tal cual", () => {
    expect(valorDeEntrada(diaria, "2026-03-15")).toBe("2026-03-15");
    expect(fechaDesdeEntrada(diaria, "2026-03-15")).toBe("2026-03-15");
  });

  it("mensual recorta a yyyy-MM y vuelve a completar con el día 1", () => {
    expect(valorDeEntrada(mensual, "2026-03-01")).toBe("2026-03");
    expect(fechaDesdeEntrada(mensual, "2026-03")).toBe("2026-03-01");
  });
});

describe("formatearEncabezado", () => {
  it("diaria muestra el día completo; mensual solo mes y año", () => {
    expect(formatearEncabezado(diaria, "2026-03-15")).toBe("15 de marzo, 2026");
    expect(formatearEncabezado(mensual, "2026-03-01")).toBe("marzo 2026");
  });
});
