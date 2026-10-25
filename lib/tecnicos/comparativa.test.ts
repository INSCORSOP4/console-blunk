import { describe, expect, it } from "vitest";
import type { Productividad } from "@/lib/api/schemas";
import { ordenarProductividad, requiereAtencion, UMBRAL_SLA_ATENCION } from "./comparativa";

const p = (tecnico: string, extra: Partial<Productividad> = {}): Productividad => ({
  tecnicoId: 1,
  tecnico,
  asignados: 10,
  cerrados: 8,
  vencidos: 1,
  cumplimientoSlaPct: 95,
  promedioHorasPrimeraRespuesta: 5,
  promedioHorasResolucion: 20,
  ...extra,
});

describe("ordenarProductividad", () => {
  const lista = [
    p("Beto", { asignados: 5 }),
    p("Ana", { asignados: 20 }),
    p("Caro", { asignados: 10 }),
  ];

  it("ordena numéricamente asc/desc", () => {
    expect(ordenarProductividad(lista, "asignados", "asc").map((x) => x.tecnico)).toEqual([
      "Beto",
      "Caro",
      "Ana",
    ]);
    expect(ordenarProductividad(lista, "asignados", "desc").map((x) => x.tecnico)).toEqual([
      "Ana",
      "Caro",
      "Beto",
    ]);
  });

  it("ordena por nombre sin distinguir acentos ni mayúsculas", () => {
    const conAcentos = [p("Ángel"), p("ana"), p("Beto")];
    expect(ordenarProductividad(conAcentos, "tecnico", "asc").map((x) => x.tecnico)).toEqual([
      "ana",
      "Ángel",
      "Beto",
    ]);
  });

  it("los nulos quedan siempre al final, en ambas direcciones", () => {
    const conNulos = [
      p("Con dato", { promedioHorasPrimeraRespuesta: 10 }),
      p("Sin dato", { promedioHorasPrimeraRespuesta: null }),
    ];
    expect(
      ordenarProductividad(conNulos, "promedioHorasPrimeraRespuesta", "asc").map((x) => x.tecnico),
    ).toEqual(["Con dato", "Sin dato"]);
    expect(
      ordenarProductividad(conNulos, "promedioHorasPrimeraRespuesta", "desc").map((x) => x.tecnico),
    ).toEqual(["Con dato", "Sin dato"]);
  });

  it("no muta la lista original", () => {
    const copia = [...lista];
    ordenarProductividad(lista, "asignados", "asc");
    expect(lista).toEqual(copia);
  });
});

describe("requiereAtencion", () => {
  it("por debajo del umbral requiere atención", () => {
    expect(requiereAtencion(p("x", { cumplimientoSlaPct: UMBRAL_SLA_ATENCION - 0.01 }))).toBe(true);
    expect(requiereAtencion(p("x", { cumplimientoSlaPct: UMBRAL_SLA_ATENCION }))).toBe(false);
    expect(requiereAtencion(p("x", { cumplimientoSlaPct: 100 }))).toBe(false);
  });
});
