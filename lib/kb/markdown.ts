import GithubSlugger from "github-slugger";
import type { EnlaceDocumento } from "@/lib/api/kb-schemas";

/** Marcador de un enlace cuya nota destino no existe (el lector lo pinta como "roto"). */
export const ENLACE_ROTO = "#enlace-roto";

const VALLA = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const WIKILINK = /!?\[\[([^\]|#\n]*)(?:#([^\]|\n]*))?(?:\|([^\]\n]*))?\]\]/g;
const CODIGO_EN_LINEA = /`[^`\n]*`/g;

const clave = (destino: string, seccion: string | null | undefined) =>
  `${destino.trim().toLowerCase()}|${(seccion ?? "").trim().toLowerCase()}`;

const escaparTexto = (s: string) => s.replace(/[[\]]/g, "\\$&");

/** Aplica `fn` solo a las líneas que NO están dentro de un bloque de código. */
function fueraDeCodigo(md: string, fn: (linea: string) => string): string {
  let valla: { c: string; n: number } | null = null;
  return md
    .split("\n")
    .map((linea) => {
      const m = VALLA.exec(linea);
      if (valla) {
        if (m && m[1][0] === valla.c && m[1].length >= valla.n && m[2].trim() === "") valla = null;
        return linea;
      }
      if (m) {
        valla = { c: m[1][0], n: m[1].length };
        return linea;
      }
      return fn(linea);
    })
    .join("\n");
}

/**
 * Convierte los `[[wikilinks]]` en enlaces Markdown normales usando lo que la API ya resolvió:
 * resueltos → /conocimiento/{id}; sin destino → marcador de enlace roto. No toca bloques ni código en línea.
 */
export function convertirWikilinks(md: string, enlaces: EnlaceDocumento[]): string {
  const resueltos = new Map<string, number>();
  for (const e of enlaces)
    if (e.resuelto) resueltos.set(clave(e.destino, e.seccion), e.resuelto.id);

  return fueraDeCodigo(md, (linea) => {
    // El código en línea se protege para que un [[ejemplo]] dentro de `comillas` no se convierta.
    const guardados: string[] = [];
    const protegida = linea.replace(CODIGO_EN_LINEA, (c) => `\u0000${guardados.push(c) - 1}\u0000`);

    const convertida = protegida.replace(
      WIKILINK,
      (_todo, destinoCrudo: string, seccion?: string, alias?: string) => {
        let destino = destinoCrudo.trim();
        if (/\.[a-z0-9]{2,5}$/i.test(destino) && !/\.md$/i.test(destino))
          return escaparTexto(destino); // adjuntos: solo el nombre
        destino = destino.replace(/\.md$/i, "");
        const sec = seccion?.trim() || null;

        // [[#Sección]]: enlace dentro de la misma nota.
        if (!destino)
          return sec
            ? `[${escaparTexto(alias?.trim() || sec)}](#${new GithubSlugger().slug(sec)})`
            : "";

        const texto = escaparTexto(alias?.trim() || (sec ? `${destino} › ${sec}` : destino));
        const id = resueltos.get(clave(destino, sec));
        if (id === undefined) return `[${texto}](${ENLACE_ROTO})`;
        return `[${texto}](/conocimiento/${id}${sec ? `#${new GithubSlugger().slug(sec)}` : ""})`;
      },
    );

    return convertida.replace(/\u0000(\d+)\u0000/g, (_t, i: string) => guardados[Number(i)]);
  });
}

export type ItemToc = { id: string; texto: string; nivel: 2 | 3 };

/** Texto visible de un encabezado (sin énfasis, código ni enlaces). */
function textoPlano(s: string): string {
  return s
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2")
    .replace(/[`*_~]/g, "")
    .trim();
}

/**
 * Índice de la nota (h2–h3). Los ids se calculan con el mismo algoritmo que rehype-slug y recorriendo TODOS los
 * encabezados en orden, para que los sufijos de repetidos (-1, -2) coincidan con los del documento renderizado.
 */
export function extraerToc(md: string): ItemToc[] {
  const slugger = new GithubSlugger();
  const items: ItemToc[] = [];
  let valla: { c: string; n: number } | null = null;

  for (const linea of md.split("\n")) {
    const f = VALLA.exec(linea);
    if (valla) {
      if (f && f[1][0] === valla.c && f[1].length >= valla.n && f[2].trim() === "") valla = null;
      continue;
    }
    if (f) {
      valla = { c: f[1][0], n: f[1].length };
      continue;
    }
    const h = /^ {0,3}(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/.exec(linea);
    if (!h) continue;
    const texto = textoPlano(h[2]);
    const id = slugger.slug(texto);
    if (h[1].length === 2 || h[1].length === 3)
      items.push({ id, texto, nivel: h[1].length as 2 | 3 });
  }
  return items;
}

const VARIANTES: Record<string, string> = {
  a: "aàáâãäå",
  e: "eèéêë",
  i: "iìíîï",
  o: "oòóôõö",
  u: "uùúûü",
  n: "nñ",
  c: "cç",
};

const quitarAcentos = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "");

/** Patrón que encuentra una palabra sin distinguir mayúsculas ni acentos (como la búsqueda del servidor). */
function patronPalabra(palabra: string): string {
  return [...quitarAcentos(palabra).toLowerCase()]
    .map((c) => (VARIANTES[c] ? `[${VARIANTES[c]}]` : c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
    .join("");
}

export type TrozoResaltado = { texto: string; resaltado: boolean };

/** Divide un texto en trozos marcando las coincidencias con las palabras buscadas (sin acentos ni mayúsculas). */
export function resaltar(texto: string, buscar: string | null | undefined): TrozoResaltado[] {
  const palabras = (buscar ?? "").split(/\s+/).filter(Boolean).slice(0, 6);
  if (palabras.length === 0 || !texto) return [{ texto, resaltado: false }];

  const rx = new RegExp(`(${palabras.map(patronPalabra).join("|")})`, "giu");
  const trozos: TrozoResaltado[] = [];
  let ultimo = 0;
  for (const m of texto.matchAll(rx)) {
    if (m.index > ultimo) trozos.push({ texto: texto.slice(ultimo, m.index), resaltado: false });
    trozos.push({ texto: m[0], resaltado: true });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) trozos.push({ texto: texto.slice(ultimo), resaltado: false });
  return trozos.length ? trozos : [{ texto, resaltado: false }];
}
