import type { CarpetaConteo } from "@/lib/api/kb-schemas";

export type NodoCarpeta = {
  nombre: string;
  /** Ruta completa ("SICPRO/Banco"), la misma que acepta el filtro `carpeta` de la API (incluye subcarpetas). */
  ruta: string;
  /** Notas que están directamente en esta carpeta. */
  propios: number;
  /** Notas en esta carpeta y todas sus subcarpetas. */
  total: number;
  hijos: NodoCarpeta[];
};

export type ArbolCarpetas = { enRaiz: number; total: number; nodos: NodoCarpeta[] };

const alfabetico = (a: NodoCarpeta, b: NodoCarpeta) =>
  a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });

/** Arma el árbol a partir de la lista plana de carpetas con conteo. Crea las carpetas intermedias que no tengan notas. */
export function armarArbol(carpetas: CarpetaConteo[]): ArbolCarpetas {
  const porRuta = new Map<string, NodoCarpeta>();
  const nodos: NodoCarpeta[] = [];
  let enRaiz = 0;

  const asegurar = (ruta: string): NodoCarpeta => {
    const existente = porRuta.get(ruta);
    if (existente) return existente;
    const i = ruta.lastIndexOf("/");
    const nodo: NodoCarpeta = { nombre: ruta.slice(i + 1), ruta, propios: 0, total: 0, hijos: [] };
    porRuta.set(ruta, nodo);
    (i < 0 ? nodos : asegurar(ruta.slice(0, i)).hijos).push(nodo);
    return nodo;
  };

  for (const { carpeta, documentos } of carpetas) {
    const ruta = carpeta.replace(/^\/+|\/+$/g, "");
    if (!ruta) {
      enRaiz += documentos;
      continue;
    }
    asegurar(ruta).propios += documentos;
  }

  const sumar = (n: NodoCarpeta): number => {
    n.hijos.sort(alfabetico);
    n.total = n.propios + n.hijos.reduce((s, h) => s + sumar(h), 0);
    return n.total;
  };
  nodos.sort(alfabetico);
  const total = enRaiz + nodos.reduce((s, n) => s + sumar(n), 0);
  return { enRaiz, total, nodos };
}

/** Rutas de todos los ancestros de una carpeta ("a/b/c" → ["a", "a/b"]) para mantenerla visible en el árbol. */
export function ancestros(ruta: string | null | undefined): string[] {
  if (!ruta) return [];
  const partes = ruta.split("/").filter(Boolean);
  return partes.slice(0, -1).map((_, i) => partes.slice(0, i + 1).join("/"));
}
