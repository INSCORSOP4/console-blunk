import { describe, expect, it } from "vitest";
import {
  construirFormData,
  filtrarEntradas,
  formatearBytes,
  quitarRaiz,
  raizComun,
  rutaDe,
  tamanoTotal,
  type EntradaSubida,
} from "./upload";

const e = (ruta: string, contenido = "x"): EntradaSubida => ({
  file: new File([contenido], ruta.split("/").pop()!),
  ruta,
});

describe("filtrarEntradas", () => {
  it("deja notas y zips, y descarta lo demás y las carpetas de Obsidian/Git", () => {
    const { aceptadas, ignoradas } = filtrarEntradas([
      e("SICPRO/Banco.md"),
      e("Nota.MD"),
      e("respaldo.zip"),
      e("img/logo.png"),
      e(".obsidian/workspace.md"),
      e("a/.git/x.md"),
      e("Cambios/.OBSIDIAN/plugins/x.md"),
      e("canvas.canvas"),
    ]);
    expect(aceptadas.map((x) => x.ruta)).toEqual(["SICPRO/Banco.md", "Nota.MD", "respaldo.zip"]);
    expect(ignoradas).toBe(5);
  });
});

describe("raiz común", () => {
  it("detecta la carpeta raíz del vault y la quita", () => {
    const entradas = [e("Mi Vault/SICPRO/A.md"), e("Mi Vault/B.md")];
    expect(raizComun(entradas)).toBe("Mi Vault");
    expect(quitarRaiz(entradas, "Mi Vault").map((x) => x.ruta)).toEqual(["SICPRO/A.md", "B.md"]);
  });

  it("no hay raíz común si hay archivos sueltos, carpetas distintas o solo zips", () => {
    expect(raizComun([e("A.md"), e("Vault/B.md")])).toBeNull();
    expect(raizComun([e("V1/A.md"), e("V2/B.md")])).toBeNull();
    expect(raizComun([e("todo.zip")])).toBeNull();
    expect(raizComun([])).toBeNull();
  });

  it("un zip junto a carpetas no impide detectar la raíz de las notas", () => {
    expect(raizComun([e("Vault/A.md"), e("otro.zip")])).toBe("Vault");
  });
});

describe("rutaDe", () => {
  it("usa la ruta relativa de la carpeta elegida o, si no hay, el nombre del archivo", () => {
    const f = new File(["x"], "A.md");
    expect(rutaDe(f)).toBe("A.md");
    Object.defineProperty(f, "webkitRelativePath", { value: "Vault\\SICPRO\\A.md" });
    expect(rutaDe(f)).toBe("Vault/SICPRO/A.md");
  });
});

describe("construirFormData", () => {
  it("manda archivos, rutas y fechas alineados por posición", () => {
    const entradas = [e("a/uno.md", "1"), e("b/dos.md", "22")];
    const form = construirFormData(entradas);

    expect(form.getAll("archivos")).toHaveLength(2);
    expect(form.getAll("rutas")).toEqual(["a/uno.md", "b/dos.md"]);
    expect(form.getAll("modificados")).toHaveLength(2);
    expect((form.getAll("archivos")[1] as File).name).toBe("dos.md");
  });
});

describe("tamaño", () => {
  it("suma y formatea", () => {
    expect(tamanoTotal([e("a.md", "12345"), e("b.md", "123")])).toBe(8);
    expect(formatearBytes(512)).toBe("512 B");
    expect(formatearBytes(2048)).toBe("2 KB");
    expect(formatearBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
