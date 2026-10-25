import { addMonths, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { hoyMx, restarDias } from "@/lib/format";
import type { ConfigBitacora } from "./grupos";

const primerDiaDelMes = (fecha: string) => `${fecha.slice(0, 7)}-01`;

/** La fecha "actual" de esta bitácora: hoy, o el día 1 del mes en curso si es mensual. */
export const fechaActual = (config: ConfigBitacora): string =>
  config.granularidad === "mes" ? primerDiaDelMes(hoyMx()) : hoyMx();

export const esFechaActual = (config: ConfigBitacora, fecha: string) =>
  fecha === fechaActual(config);

/** Un paso hacia atrás (dirección -1) o hacia adelante (dirección 1): un día o un mes, según la bitácora. */
export function avanzar(config: ConfigBitacora, fecha: string, direccion: -1 | 1): string {
  if (config.granularidad === "dia") return restarDias(fecha, -direccion);
  return primerDiaDelMes(format(addMonths(parseISO(fecha), direccion), "yyyy-MM-dd"));
}

/** Valor para <input type="date"> o <input type="month"> según la granularidad. */
export const valorDeEntrada = (config: ConfigBitacora, fecha: string): string =>
  config.granularidad === "mes" ? fecha.slice(0, 7) : fecha;

/** Lo que entrega el <input> (yyyy-MM-dd o yyyy-MM) de vuelta a una fecha completa (siempre día 1 si es mensual). */
export const fechaDesdeEntrada = (config: ConfigBitacora, valor: string): string =>
  config.granularidad === "mes" ? `${valor}-01` : valor;

export const formatearEncabezado = (config: ConfigBitacora, fecha: string): string =>
  config.granularidad === "mes"
    ? format(parseISO(fecha), "MMMM yyyy", { locale: es })
    : format(parseISO(fecha), "d 'de' MMMM, yyyy", { locale: es });
