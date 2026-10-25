import type { ArchivoRevisado, EstadoArchivo } from "@/lib/api/utilerias-schemas";

export type FiltroEstado = "todos" | "atencion" | "actualizado" | "sinRevisar";

export const ETIQUETA_ESTADO: Record<EstadoArchivo, string> = {
  Actualizado: "Actualizado",
  Desactualizado: "Desactualizado",
  Faltante: "Faltante",
  Error: "Error",
  SinRevisar: "Sin revisar",
};

export type TonoEstado = "ok" | "warn" | "danger" | "neutral";

export const tonoEstado = (estado: EstadoArchivo): TonoEstado => {
  switch (estado) {
    case "Actualizado":
      return "ok";
    case "Desactualizado":
      return "warn";
    case "Faltante":
    case "Error":
      return "danger";
    default:
      return "neutral";
  }
};

/** Cualquier cosa que no sea "Actualizado" necesita que alguien lo mire. */
export const requiereAtencion = (a: ArchivoRevisado) => a.estado !== "Actualizado";

export type ConteoArchivos = {
  total: number;
  atencion: number;
  actualizado: number;
  sinRevisar: number;
};

export function contarArchivos(archivos: ArchivoRevisado[]): ConteoArchivos {
  return {
    total: archivos.length,
    atencion: archivos.filter((a) => requiereAtencion(a) && a.estado !== "SinRevisar").length,
    actualizado: archivos.filter((a) => a.estado === "Actualizado").length,
    sinRevisar: archivos.filter((a) => a.estado === "SinRevisar").length,
  };
}

const sinAcentos = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export function filtrarArchivos(
  archivos: ArchivoRevisado[],
  filtro: FiltroEstado,
  buscar: string,
): ArchivoRevisado[] {
  const texto = sinAcentos(buscar.trim());
  return archivos.filter((a) => {
    if (texto && !sinAcentos(`${a.ruta} ${a.nombreArchivo}`).includes(texto)) return false;
    switch (filtro) {
      case "atencion":
        return requiereAtencion(a) && a.estado !== "SinRevisar";
      case "actualizado":
        return a.estado === "Actualizado";
      case "sinRevisar":
        return a.estado === "SinRevisar";
      default:
        return true;
    }
  });
}

/** Agrupa por carpeta de red, en el mismo orden en que ya vienen (por Ruta, NombreArchivo). */
export function agruparPorRuta(archivos: ArchivoRevisado[]): Map<string, ArchivoRevisado[]> {
  const grupos = new Map<string, ArchivoRevisado[]>();
  for (const a of archivos) {
    const lista = grupos.get(a.ruta);
    if (lista) lista.push(a);
    else grupos.set(a.ruta, [a]);
  }
  return grupos;
}
