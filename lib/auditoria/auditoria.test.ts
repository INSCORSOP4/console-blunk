import { describe, expect, it } from "vitest";
import type { EventoAuditoria } from "@/lib/api/auditoria-schemas";
import { contarPorModulo, filtrarEventos, tonoResultado } from "./auditoria";

const e = (overrides: Partial<EventoAuditoria> = {}): EventoAuditoria => ({
  fecha: "2026-10-10T10:00:00-06:00",
  modulo: "Conocimiento",
  accion: "Importación de notas",
  detalle: "carpeta · 5 nuevas",
  usuarioNombre: "Francisco López",
  usuarioEmail: "francisco@prosur.mx",
  resultado: "Completada",
  ...overrides,
});

describe("filtrarEventos", () => {
  const eventos = [
    e({ modulo: "Conocimiento" }),
    e({
      modulo: "Microsip",
      accion: "Alta en MICROSIP",
      detalle: "JUVE",
      usuarioNombre: "Karla Díaz",
    }),
    e({
      modulo: "Bitacora",
      accion: "Job Chesa",
      detalle: "se apagó por falla eléctrica",
      usuarioNombre: "Javier",
    }),
  ];

  it("filtra por módulo", () => {
    expect(filtrarEventos(eventos, "Microsip", "").map((x) => x.accion)).toEqual([
      "Alta en MICROSIP",
    ]);
    expect(filtrarEventos(eventos, "todos", "")).toHaveLength(3);
  });

  it("busca sin distinguir acentos ni mayúsculas en acción, detalle y usuario", () => {
    expect(filtrarEventos(eventos, "todos", "electrica").map((x) => x.modulo)).toEqual([
      "Bitacora",
    ]);
    expect(filtrarEventos(eventos, "todos", "KARLA").map((x) => x.modulo)).toEqual(["Microsip"]);
    expect(filtrarEventos(eventos, "todos", "juve")).toHaveLength(1);
  });

  it("combina módulo y búsqueda", () => {
    expect(filtrarEventos(eventos, "Conocimiento", "javier")).toHaveLength(0);
  });

  it("un detalle null no rompe la búsqueda", () => {
    expect(filtrarEventos([e({ detalle: null })], "todos", "algo")).toHaveLength(0);
  });
});

describe("tonoResultado", () => {
  it("agrupa el vocabulario de cada módulo en los mismos colores", () => {
    expect(tonoResultado("Completada")).toBe("ok");
    expect(tonoResultado("Aplicado")).toBe("ok");
    expect(tonoResultado("Ok")).toBe("ok");
    expect(tonoResultado("Fallida")).toBe("danger");
    expect(tonoResultado("Fallido")).toBe("danger");
    expect(tonoResultado("Critico")).toBe("danger");
    expect(tonoResultado("NoVerificado")).toBe("warn");
    expect(tonoResultado("EnCurso")).toBe("info");
    expect(tonoResultado(null)).toBe("neutral");
    expect(tonoResultado("ValorDesconocido")).toBe("neutral");
  });
});

describe("contarPorModulo", () => {
  it("cuenta cada módulo, incluso en cero", () => {
    expect(contarPorModulo([e({ modulo: "Conocimiento" }), e({ modulo: "Conocimiento" })])).toEqual(
      {
        Conocimiento: 2,
        Microsip: 0,
        Bitacora: 0,
      },
    );
  });
});
