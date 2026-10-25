import { GRUPO_ACTIVIDADES_SOFT } from "@/lib/api/bitacora-schemas";

export const GRUPO_RESPALDOS = "respaldos";
export const GRUPO_CAMARAS = "camaras";
export const GRUPO_DEPURACION_RESPALDOS = "depuracion-respaldos";

export type ConfigBitacora = {
  grupo: string;
  /** Prefijo de las rutas de esta bitácora: `${rutaBase}` es el checklist, `${rutaBase}/catalogo` el catálogo. */
  rutaBase: string;
  titulo: string;
  descripcion: string;
  /** Para los textos del catálogo: "Catálogo de {nombrePlural}", "Agregar {nombreSingular}"... */
  nombreSingular: string;
  nombrePlural: string;
  /** Género gramatical de nombreSingular/nombrePlural, para el artículo correcto ("el/la", "los/las"). */
  genero: "m" | "f";
  /** "dia": un checklist por día (como la bitácora en Excel). "mes": uno por mes (p. ej. depuración de respaldos). */
  granularidad: "dia" | "mes";
};

export const BITACORAS: ConfigBitacora[] = [
  {
    grupo: GRUPO_ACTIVIDADES_SOFT,
    rutaBase: "/bitacora/actividades",
    titulo: "Actividades diarias",
    descripcion: "Las revisiones y jobs que se verifican todos los días.",
    nombreSingular: "actividad",
    nombrePlural: "actividades",
    genero: "f",
    granularidad: "dia",
  },
  {
    grupo: GRUPO_RESPALDOS,
    rutaBase: "/bitacora/respaldos",
    titulo: "Respaldos",
    descripcion: "Revisión diaria de los respaldos del día anterior.",
    nombreSingular: "respaldo",
    nombrePlural: "respaldos",
    genero: "m",
    granularidad: "dia",
  },
  {
    grupo: GRUPO_CAMARAS,
    rutaBase: "/bitacora/camaras",
    titulo: "Cámaras",
    descripcion: "Revisión diaria de los grupos de cámaras: si graban y con qué detalle.",
    nombreSingular: "grupo de cámaras",
    nombrePlural: "grupos de cámaras",
    genero: "m",
    granularidad: "dia",
  },
  {
    grupo: GRUPO_DEPURACION_RESPALDOS,
    rutaBase: "/bitacora/depuracion-respaldos",
    titulo: "Depuración de respaldos",
    descripcion: "Revisión mensual de la depuración de respaldos antiguos, por tipo.",
    nombreSingular: "tipo de respaldo",
    nombrePlural: "tipos de respaldo",
    genero: "m",
    granularidad: "mes",
  },
];

export const obtenerConfigBitacora = (grupo: string): ConfigBitacora =>
  BITACORAS.find((b) => b.grupo === grupo) ?? BITACORAS[0];

/** Artículo singular ("el"/"la") y plural ("los"/"las") según el género de la bitácora. */
export const articuloSingular = (config: ConfigBitacora) => (config.genero === "f" ? "la" : "el");
export const articuloPlural = (config: ConfigBitacora) => (config.genero === "f" ? "las" : "los");
/** "del" o "de la", para frases como "Nombre del respaldo" / "Nombre de la actividad". */
export const preposicionSingular = (config: ConfigBitacora) =>
  config.genero === "f" ? "de la" : "del";
