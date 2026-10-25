import { describe, expect, it } from "vitest";
import type { ArchivoRevisado } from "@/lib/api/utilerias-schemas";
import {
  agruparPorRuta,
  contarArchivos,
  filtrarArchivos,
  requiereAtencion,
  tonoEstado,
} from "./archivos";

const a = (overrides: Partial<ArchivoRevisado> = {}): ArchivoRevisado => ({
  archivoId: 1,
  ruta: "\\\\172.26.12.160\\Publico",
  nombreArchivo: "repbi17.csv",
  fecha: "2026-10-18",
  estado: "Actualizado",
  ultimaModificacion: "2026-10-18T01:30:00-06:00",
  detalle: null,
  revisadoEn: "2026-10-18T06:30:00-06:00",
  ...overrides,
});

describe("requiereAtencion / tonoEstado", () => {
  it("solo Actualizado no requiere atencion", () => {
    expect(requiereAtencion(a({ estado: "Actualizado" }))).toBe(false);
    expect(requiereAtencion(a({ estado: "Desactualizado" }))).toBe(true);
    expect(requiereAtencion(a({ estado: "Faltante" }))).toBe(true);
    expect(requiereAtencion(a({ estado: "Error" }))).toBe(true);
    expect(requiereAtencion(a({ estado: "SinRevisar" }))).toBe(true);
  });

  it("asigna el tono correcto a cada estado", () => {
    expect(tonoEstado("Actualizado")).toBe("ok");
    expect(tonoEstado("Desactualizado")).toBe("warn");
    expect(tonoEstado("Faltante")).toBe("danger");
    expect(tonoEstado("Error")).toBe("danger");
    expect(tonoEstado("SinRevisar")).toBe("neutral");
  });
});

describe("contarArchivos", () => {
  it("cuenta atencion sin incluir SinRevisar aparte", () => {
    const archivos = [
      a({ estado: "Actualizado" }),
      a({ estado: "Desactualizado" }),
      a({ estado: "Faltante" }),
      a({ estado: "SinRevisar" }),
    ];
    expect(contarArchivos(archivos)).toEqual({
      total: 4,
      atencion: 2,
      actualizado: 1,
      sinRevisar: 1,
    });
  });
});

describe("filtrarArchivos", () => {
  const archivos = [
    a({ ruta: "\\\\172.26.12.160\\Publico", nombreArchivo: "repbi17.csv", estado: "Actualizado" }),
    a({ ruta: "\\\\10.50.0.31\\pasa", nombreArchivo: "olap302.txt", estado: "Faltante" }),
    a({ ruta: "\\\\10.8.0.32\\pasa", nombreArchivo: "Repbi12.txt", estado: "SinRevisar" }),
  ];

  it("filtra por estado", () => {
    expect(filtrarArchivos(archivos, "atencion", "").map((x) => x.nombreArchivo)).toEqual([
      "olap302.txt",
    ]);
    expect(filtrarArchivos(archivos, "sinRevisar", "")).toHaveLength(1);
    expect(filtrarArchivos(archivos, "todos", "")).toHaveLength(3);
  });

  it("busca por ruta o nombre, sin distinguir mayusculas ni acentos", () => {
    expect(filtrarArchivos(archivos, "todos", "repbi12").map((x) => x.nombreArchivo)).toEqual([
      "Repbi12.txt",
    ]);
    expect(filtrarArchivos(archivos, "todos", "10.50.0.31")).toHaveLength(1);
  });
});

describe("agruparPorRuta", () => {
  it("agrupa manteniendo el orden de llegada", () => {
    const archivos = [
      a({ ruta: "A", nombreArchivo: "1" }),
      a({ ruta: "B", nombreArchivo: "2" }),
      a({ ruta: "A", nombreArchivo: "3" }),
    ];
    const grupos = agruparPorRuta(archivos);
    expect([...grupos.keys()]).toEqual(["A", "B"]);
    expect(grupos.get("A")?.map((x) => x.nombreArchivo)).toEqual(["1", "3"]);
  });
});
