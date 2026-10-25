export type EntradaSubida = { file: File; ruta: string };

// Mismos topes que la API (que es quien los hace cumplir; aquí solo se avisa antes de subir).
export const MAX_BYTES_PETICION = 60 * 1024 * 1024;
export const MAX_BYTES_ARCHIVO = 1024 * 1024;
export const MAX_ARCHIVOS = 500;
const MAX_ENTRADAS_RECORRIDO = 3000;

const CARPETAS_IGNORADAS = new Set([".obsidian", ".git", ".trash", "node_modules"]);

const normalizar = (ruta: string) => ruta.replace(/\\/g, "/").replace(/^\/+/, "");

export const esZip = (ruta: string) => /\.zip$/i.test(ruta);
export const esNota = (ruta: string) => /\.md$/i.test(ruta);

/** Ruta relativa de un archivo elegido con "Elegir carpeta" o con "Elegir archivos". */
export function rutaDe(file: File): string {
  const relativa = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  return normalizar(relativa || file.name);
}

/** Se queda con las notas (.md) y los .zip, sin las carpetas de Obsidian/Git. Informa cuántos descartó. */
export function filtrarEntradas(entradas: EntradaSubida[]): {
  aceptadas: EntradaSubida[];
  ignoradas: number;
} {
  const aceptadas = entradas.filter(({ ruta }) => {
    const carpetas = ruta.split("/").slice(0, -1);
    if (carpetas.some((c) => CARPETAS_IGNORADAS.has(c.toLowerCase()))) return false;
    return esNota(ruta) || esZip(ruta);
  });
  return { aceptadas, ignoradas: entradas.length - aceptadas.length };
}

/** Si todas las rutas cuelgan de una misma carpeta raíz (p. ej. "Mi Vault/…"), devuelve su nombre. */
export function raizComun(entradas: EntradaSubida[]): string | null {
  const carpetas = entradas.filter((e) => !esZip(e.ruta));
  if (carpetas.length === 0 || carpetas.some((e) => !e.ruta.includes("/"))) return null;
  const primera = carpetas[0].ruta.split("/")[0];
  return carpetas.every((e) => e.ruta.split("/")[0] === primera) ? primera : null;
}

export function quitarRaiz(entradas: EntradaSubida[], raiz: string): EntradaSubida[] {
  const prefijo = `${raiz}/`;
  return entradas.map((e) =>
    e.ruta.startsWith(prefijo) ? { ...e, ruta: e.ruta.slice(prefijo.length) } : e,
  );
}

export function tamanoTotal(entradas: EntradaSubida[]): number {
  return entradas.reduce((suma, e) => suma + e.file.size, 0);
}

/** Campos alineados por posición: archivos[i] ↔ rutas[i] ↔ modificados[i] (así lo lee la API). */
export function construirFormData(entradas: EntradaSubida[]): FormData {
  const form = new FormData();
  for (const { file, ruta } of entradas) {
    form.append("archivos", file, file.name);
    form.append("rutas", ruta);
    form.append("modificados", String(file.lastModified || ""));
  }
  return form;
}

// ---------------------------------------------------------------- arrastrar y soltar (carpetas incluidas)
type EntradaFs = FileSystemEntry & { fullPath: string };

const leerLote = (lector: FileSystemDirectoryReader) =>
  new Promise<FileSystemEntry[]>((resolve, reject) => lector.readEntries(resolve, reject));

const archivoDe = (entrada: FileSystemFileEntry) =>
  new Promise<File>((resolve, reject) => entrada.file(resolve, reject));

async function recorrer(
  entrada: EntradaFs,
  salida: EntradaSubida[],
  tope: { n: number },
): Promise<void> {
  if (tope.n >= MAX_ENTRADAS_RECORRIDO) return;
  if (entrada.isFile) {
    tope.n++;
    salida.push({
      file: await archivoDe(entrada as FileSystemFileEntry),
      ruta: normalizar(entrada.fullPath),
    });
    return;
  }
  if (!entrada.isDirectory) return;
  if (CARPETAS_IGNORADAS.has(entrada.name.toLowerCase())) return; // no se recorre ni .obsidian ni .git
  const lector = (entrada as FileSystemDirectoryEntry).createReader();
  // readEntries entrega de 100 en 100: se repite hasta que venga vacío.
  for (let lote = await leerLote(lector); lote.length > 0; lote = await leerLote(lector)) {
    for (const hijo of lote) await recorrer(hijo as EntradaFs, salida, tope);
  }
}

/** Archivos soltados en la zona de arrastre; recorre las carpetas completas. */
export async function entradasDeDrop(dt: DataTransfer): Promise<EntradaSubida[]> {
  const salida: EntradaSubida[] = [];
  const tope = { n: 0 };
  const items = [...dt.items].filter((i) => i.kind === "file");
  const entradas = items.map((i) => i.webkitGetAsEntry?.() ?? null);

  if (entradas.some((e) => e === null)) {
    // Navegador sin webkitGetAsEntry: solo archivos sueltos.
    return [...dt.files].map((file) => ({ file, ruta: rutaDe(file) }));
  }
  for (const e of entradas) if (e) await recorrer(e as EntradaFs, salida, tope);
  return salida;
}

export const formatearBytes = (n: number) =>
  n < 1024
    ? `${n} B`
    : n < 1024 * 1024
      ? `${(n / 1024).toFixed(0)} KB`
      : `${(n / 1024 / 1024).toFixed(1)} MB`;
