import { describe, expect, it } from "vitest";
import type { EstadoJob, JobPaso, JobResumen } from "@/lib/api/utilerias-schemas";
import { contarJobs, filtrarJobs, fmtDuracion, fmtFechaServidor, requiereAtencion } from "./jobs";

const paso = (estado: EstadoJob): JobPaso => ({
  id: 1,
  nombre: "p",
  estado,
  ultimaEjecucion: null,
  duracionSegundos: null,
  mensaje: null,
});
const job = (nombre: string, estado: EstadoJob, extra: Partial<JobResumen> = {}): JobResumen => ({
  nombre,
  habilitado: true,
  estado,
  ultimaEjecucion: null,
  duracionSegundos: null,
  siguienteEjecucion: null,
  pasoEnEjecucion: null,
  pasos: [],
  ...extra,
});

const jobs = [
  job("Calzamoda", "Fallido"),
  job("Chesa", "Exitoso", { pasos: [paso("Exitoso"), paso("Fallido")] }), // paso fallido con job en verde
  job("Insumos", "Exitoso"),
  job("Corriendo", "EnEjecucion"),
  job("Apagado", "Fallido", { habilitado: false }),
];

describe("requiereAtencion / contarJobs", () => {
  it("un paso fallido cuenta aunque el job haya terminado bien; un job deshabilitado no", () => {
    expect(requiereAtencion(jobs[1])).toBe(true);
    expect(requiereAtencion(jobs[4])).toBe(false);
  });

  it("cuenta cada grupo una sola vez", () => {
    expect(contarJobs(jobs)).toEqual({
      total: 5,
      atencion: 2,
      ejecutando: 1,
      ok: 1,
      deshabilitados: 1,
    });
  });
});

describe("filtrarJobs", () => {
  it("filtra por estado", () => {
    expect(filtrarJobs(jobs, "atencion", "").map((j) => j.nombre)).toEqual(["Calzamoda", "Chesa"]);
    expect(filtrarJobs(jobs, "ok", "").map((j) => j.nombre)).toEqual(["Insumos"]);
    expect(filtrarJobs(jobs, "ejecutando", "").map((j) => j.nombre)).toEqual(["Corriendo"]);
    expect(filtrarJobs(jobs, "deshabilitados", "").map((j) => j.nombre)).toEqual(["Apagado"]);
    expect(filtrarJobs(jobs, "todos", "")).toHaveLength(5);
  });

  it("busca por nombre sin distinguir mayúsculas ni acentos y combina con el estado", () => {
    expect(filtrarJobs(jobs, "todos", "  CHE ").map((j) => j.nombre)).toEqual(["Chesa"]);
    expect(filtrarJobs([job("Conciliación", "Exitoso")], "todos", "conciliacion")).toHaveLength(1);
    expect(filtrarJobs(jobs, "ok", "chesa")).toHaveLength(0);
  });
});

describe("fmtDuracion", () => {
  it.each([
    [null, "—"],
    [0, "0 s"],
    [45, "45 s"],
    [60, "1 min"],
    [125, "2 min 5 s"],
    [3600, "1 h"],
    [5445, "1 h 30 min"],
  ])("%s → %s", (entrada, esperado) => expect(fmtDuracion(entrada)).toBe(esperado));
});

describe("fmtFechaServidor", () => {
  it("muestra la hora tal cual viene, sin moverla de zona", () => {
    expect(fmtFechaServidor("2026-10-07T07:00:00", "HH:mm")).toBe("07:00");
    expect(fmtFechaServidor("2026-10-07T23:59:59", "yyyy-MM-dd HH:mm:ss")).toBe(
      "2026-10-07 23:59:59",
    );
    expect(fmtFechaServidor(null)).toBe("—");
  });
});
