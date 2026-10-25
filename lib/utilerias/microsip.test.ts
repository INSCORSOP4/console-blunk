import { describe, expect, it } from "vitest";
import type { TrabajadorFortia, UsuarioMicrosip } from "@/lib/api/utilerias-schemas";
import {
  compararConFortia,
  contarUsuarios,
  excedeLimites,
  filtrarUsuarios,
  parsearClave,
  usuariosConClave,
} from "./microsip";

const u = (id: number, nombre: string, extra: Partial<UsuarioMicrosip> = {}): UsuarioMicrosip => ({
  usuarioId: id,
  nombre,
  estatus: "A",
  activo: true,
  claveFortia: null,
  nombreUsuario: null,
  empresa: null,
  puesto: null,
  tieneDatosAdicionales: false,
  ...extra,
});

const usuarios = [
  u(1, "ANA.PEREZ", {
    claveFortia: "1234",
    nombreUsuario: "Ana Pérez López",
    empresa: "PROSUR",
    puesto: "Analista",
    tieneDatosAdicionales: true,
  }),
  u(2, "LUIS.GOMEZ"),
  u(3, "MARTA.RUIZ", { activo: false, estatus: "B" }),
  u(4, "JOSE.NUÑEZ", { claveFortia: "0099", tieneDatosAdicionales: true }),
];

describe("contarUsuarios / filtrarUsuarios", () => {
  it("cuenta activos, sin clave (solo activos), con clave y baja", () => {
    expect(contarUsuarios(usuarios)).toEqual({
      total: 4,
      activos: 3,
      sinClave: 1,
      conClave: 2,
      baja: 1,
    });
  });

  it("filtra por estado", () => {
    expect(filtrarUsuarios(usuarios, "activos", "").map((x) => x.usuarioId)).toEqual([1, 2, 4]);
    expect(filtrarUsuarios(usuarios, "sinClave", "").map((x) => x.usuarioId)).toEqual([2]); // la baja sin clave no cuenta
    expect(filtrarUsuarios(usuarios, "baja", "").map((x) => x.usuarioId)).toEqual([3]);
    expect(filtrarUsuarios(usuarios, "todos", "")).toHaveLength(4);
  });

  it("busca en nombre, clave, empresa y puesto sin distinguir acentos ni mayúsculas", () => {
    expect(filtrarUsuarios(usuarios, "todos", "perez").map((x) => x.usuarioId)).toEqual([1]);
    expect(filtrarUsuarios(usuarios, "todos", "nunez").map((x) => x.usuarioId)).toEqual([4]);
    expect(filtrarUsuarios(usuarios, "todos", "1234").map((x) => x.usuarioId)).toEqual([1]);
    expect(filtrarUsuarios(usuarios, "todos", "ANALISTA").map((x) => x.usuarioId)).toEqual([1]);
    expect(filtrarUsuarios(usuarios, "activos", "marta")).toHaveLength(0);
  });
});

describe("parsearClave", () => {
  it.each([
    ["1234", 1234],
    [" 77 ", 77],
    ["000123", 123],
  ])("%j → %s", (texto, esperado) => expect(parsearClave(texto)).toBe(esperado));

  it.each(["", "abc", "12a", "-5", "0", "00", "1.5", "1234567890", "1 2", "12;DROP"])(
    "%j no es válida",
    (texto) => expect(parsearClave(texto)).toBeNull(),
  );
});

describe("usuariosConClave", () => {
  it("encuentra a otros usuarios con la misma clave, aunque difiera en ceros a la izquierda, y excluye al propio", () => {
    expect(usuariosConClave(usuarios, 99, 2).map((x) => x.usuarioId)).toEqual([4]);
    expect(usuariosConClave(usuarios, 1234, 1)).toEqual([]);
    expect(usuariosConClave(usuarios, 1234, 2).map((x) => x.usuarioId)).toEqual([1]);
  });
});

describe("compararConFortia / excedeLimites", () => {
  const t: TrabajadorFortia = {
    clave: 1234,
    nombreCompleto: "Ana Pérez López",
    empresa: "PROSUR",
    puesto: "Jefa",
  };

  it("marca solo lo que cambia", () => {
    const filas = compararConFortia(usuarios[0], t);
    expect(filas.map((f) => [f.campo, f.cambia])).toEqual([
      ["Clave de FORTIA", false],
      ["Nombre", false],
      ["Empresa", false],
      ["Puesto", true],
    ]);
  });

  it("para un usuario sin datos todo cambia", () => {
    expect(compararConFortia(usuarios[1], t).every((f) => f.cambia && f.antes === null)).toBe(true);
  });

  it("avisa cuando FORTIA trae un dato más largo que la columna de MICROSIP", () => {
    expect(excedeLimites({ ...t, empresa: "E".repeat(51) })).toEqual(["La empresa"]);
    expect(excedeLimites({ ...t, empresa: "E".repeat(50) })).toEqual([]);
    expect(
      excedeLimites({ ...t, nombreCompleto: "N".repeat(101), puesto: "P".repeat(101) }),
    ).toEqual(["El nombre", "El puesto"]);
  });
});
