import { describe, expect, it } from "vitest";
import { ancestros, armarArbol } from "./arbol";

describe("armarArbol", () => {
  it("anida las carpetas, suma los totales, ordena sin distinguir acentos y separa las notas de la raíz", () => {
    const arbol = armarArbol([
      { carpeta: "", documentos: 2 },
      { carpeta: "SICPRO", documentos: 7 },
      { carpeta: "SICPRO/Banco", documentos: 3 },
      { carpeta: "Árbol", documentos: 1 },
      { carpeta: "CERO PAPEL", documentos: 16 },
    ]);

    expect(arbol.enRaiz).toBe(2);
    expect(arbol.total).toBe(29);
    expect(arbol.nodos.map((n) => n.nombre)).toEqual(["Árbol", "CERO PAPEL", "SICPRO"]);
    const sicpro = arbol.nodos.find((n) => n.nombre === "SICPRO")!;
    expect(sicpro).toMatchObject({ ruta: "SICPRO", propios: 7, total: 10 });
    expect(sicpro.hijos).toEqual([
      { nombre: "Banco", ruta: "SICPRO/Banco", propios: 3, total: 3, hijos: [] },
    ]);
  });

  it("crea las carpetas intermedias que no tienen notas propias", () => {
    const arbol = armarArbol([{ carpeta: "a/b/c", documentos: 4 }]);
    expect(arbol.nodos[0]).toMatchObject({ nombre: "a", propios: 0, total: 4 });
    expect(arbol.nodos[0].hijos[0]).toMatchObject({
      nombre: "b",
      ruta: "a/b",
      propios: 0,
      total: 4,
    });
    expect(arbol.nodos[0].hijos[0].hijos[0]).toMatchObject({
      nombre: "c",
      ruta: "a/b/c",
      propios: 4,
    });
  });

  it("una lista vacía da un árbol vacío", () => {
    expect(armarArbol([])).toEqual({ enRaiz: 0, total: 0, nodos: [] });
  });
});

describe("ancestros", () => {
  it("devuelve las rutas de los padres", () => {
    expect(ancestros("a/b/c")).toEqual(["a", "a/b"]);
    expect(ancestros("a")).toEqual([]);
    expect(ancestros("")).toEqual([]);
    expect(ancestros(null)).toEqual([]);
  });
});
