import type { EventoAuditoria, ModuloAuditoria } from "@/lib/api/auditoria-schemas";

export const ETIQUETA_MODULO: Record<ModuloAuditoria, string> = {
  Conocimiento: "Conocimiento",
  Microsip: "MICROSIP",
  Bitacora: "Bitácora",
};

export type FiltroModulo = "todos" | ModuloAuditoria;

const sinAcentos = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Filtra por módulo y busca sin distinguir acentos ni mayúsculas en acción, detalle y usuario. */
export function filtrarEventos(
  eventos: EventoAuditoria[],
  modulo: FiltroModulo,
  buscar: string,
): EventoAuditoria[] {
  const texto = sinAcentos(buscar.trim());
  return eventos.filter((e) => {
    if (modulo !== "todos" && e.modulo !== modulo) return false;
    if (!texto) return true;
    return [e.accion, e.detalle, e.usuarioNombre, e.usuarioEmail].some(
      (campo) => campo && sinAcentos(campo).includes(texto),
    );
  });
}

export type TonoResultado = "ok" | "warn" | "danger" | "info" | "neutral";

/** Cada módulo tiene su propio vocabulario de "resultado"; este es el color que le corresponde a cada uno. */
export function tonoResultado(resultado: string | null): TonoResultado {
  switch (resultado) {
    case "Completada":
    case "Aplicado":
    case "Ok":
      return "ok";
    case "Fallida":
    case "Fallido":
    case "Falla":
    case "Critico":
      return "danger";
    case "Advertencia":
    case "NoVerificado":
    case "Cancelado":
    case "Reintento":
      return "warn";
    case "EnCurso":
    case "Pendiente":
      return "info";
    default:
      return "neutral";
  }
}

/** Cuántos eventos hay de cada módulo, para los contadores de los botones de filtro. */
export function contarPorModulo(eventos: EventoAuditoria[]): Record<ModuloAuditoria, number> {
  const conteo: Record<ModuloAuditoria, number> = { Conocimiento: 0, Microsip: 0, Bitacora: 0 };
  for (const e of eventos) conteo[e.modulo]++;
  return conteo;
}
