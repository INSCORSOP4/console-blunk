import { describe, expect, it } from "vitest";
import type { EnlaceDocumento } from "@/lib/api/kb-schemas";
import { convertirWikilinks, ENLACE_ROTO, extraerToc, resaltar } from "./markdown";

const enlace = (
  destino: string,
  id: number | null,
  seccion: string | null = null,
): EnlaceDocumento => ({
  destino,
  seccion,
  textoVisible: null,
  resuelto: id === null ? null : { id, titulo: destino, ruta: `${destino}.md`, carpeta: "" },
});

describe("convertirWikilinks", () => {
  const enlaces = [
    enlace("Módulo Banco", 12),
    enlace("Docker", 7, "Respaldos"),
    enlace("No existe", null),
  ];

  it("convierte los resueltos en enlaces a la nota y deja marcados los rotos", () => {
    const md = "Ver [[Módulo Banco]], [[Docker#Respaldos|restaurar]] y [[No existe]].";
    expect(convertirWikilinks(md, enlaces)).toBe(
      `Ver [Módulo Banco](/conocimiento/12), [restaurar](/conocimiento/7#respaldos) y [No existe](${ENLACE_ROTO}).`,
    );
  });

  it("no distingue mayúsculas ni la extensión .md al buscar el destino resuelto", () => {
    expect(convertirWikilinks("[[módulo banco.md]]", enlaces)).toBe(
      "[módulo banco](/conocimiento/12)",
    );
  });

  it("muestra 'destino › sección' cuando no hay alias y enlaza la misma nota con [[#Sección]]", () => {
    expect(convertirWikilinks("[[Docker#Respaldos]]", enlaces)).toBe(
      "[Docker › Respaldos](/conocimiento/7#respaldos)",
    );
    expect(convertirWikilinks("[[#Mi sección]]", enlaces)).toBe("[Mi sección](#mi-sección)");
  });

  it("no toca los bloques de código ni el código en línea", () => {
    const md =
      "```\n[[Módulo Banco]]\n```\ntexto `[[Módulo Banco]]` y [[Módulo Banco]]\n~~~\n[[Docker]]\n~~~";
    const r = convertirWikilinks(md, enlaces);
    expect(r).toContain("```\n[[Módulo Banco]]\n```");
    expect(r).toContain("`[[Módulo Banco]]` y [Módulo Banco](/conocimiento/12)");
    expect(r).toContain("~~~\n[[Docker]]\n~~~");
  });

  it("los adjuntos quedan como texto y los corchetes del alias se escapan", () => {
    expect(convertirWikilinks("![[captura.png]]", enlaces)).toBe("captura.png");
    expect(convertirWikilinks("[[Módulo Banco|a [b c]]", enlaces)).toBe(
      "[a \\[b c](/conocimiento/12)",
    );
  });
});

describe("extraerToc", () => {
  it("lista h2 y h3 con ids como rehype-slug, incluidos los repetidos", () => {
    const md = "# Título\n## Conexión\ntexto\n### Conexión\n## **Ver** [[Banco]]\n#### cuatro";
    expect(extraerToc(md)).toEqual([
      { id: "conexión", texto: "Conexión", nivel: 2 },
      { id: "conexión-1", texto: "Conexión", nivel: 3 },
      { id: "ver-banco", texto: "Ver Banco", nivel: 2 },
    ]);
  });

  it("ignora los encabezados que están dentro de bloques de código", () => {
    const md = "## Real\n```bash\n## comentario\n```\n## Otro";
    expect(extraerToc(md).map((i) => i.texto)).toEqual(["Real", "Otro"]);
  });

  it("los ids de repetidos cuentan también los h1 y h4 (como el documento renderizado)", () => {
    expect(extraerToc("# Uso\n## Uso").map((i) => i.id)).toEqual(["uso-1"]);
  });
});

describe("resaltar", () => {
  const solo = (t: string, b: string) =>
    resaltar(t, b)
      .filter((x) => x.resaltado)
      .map((x) => x.texto);

  it("resalta sin distinguir mayúsculas ni acentos, conservando el texto original", () => {
    expect(solo("La Contraseña del usuario", "contrasena")).toEqual(["Contraseña"]);
    expect(solo("Configuración de la CONFIGURACION", "configuracion")).toEqual([
      "Configuración",
      "CONFIGURACION",
    ]);
    expect(solo("Año nuevo", "ano")).toEqual(["Año"]);
  });

  it("varias palabras y caracteres especiales de regex sin romperse", () => {
    expect(solo("100% de (bancos) y más", "100% (bancos)")).toEqual(["100%", "(bancos)"]);
    expect(solo("a.b a+b", "a.b")).toEqual(["a.b"]);
  });

  it("sin búsqueda o sin coincidencias devuelve el texto entero", () => {
    expect(resaltar("hola", "")).toEqual([{ texto: "hola", resaltado: false }]);
    expect(resaltar("hola", "zzz")).toEqual([{ texto: "hola", resaltado: false }]);
    expect(resaltar("", "x")).toEqual([{ texto: "", resaltado: false }]);
  });

  it("los trozos reconstruyen el texto original", () => {
    const t = "Respaldo del respaldo y más respaldos";
    expect(
      resaltar(t, "respaldo")
        .map((x) => x.texto)
        .join(""),
    ).toBe(t);
  });
});
