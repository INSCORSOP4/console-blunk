import { z } from "zod";

// Esquemas de la base de conocimiento. La API responde en camelCase y omite los nulos de los informes.
const fecha = z.string();

export const documentoResumenSchema = z.object({
  id: z.number(),
  ruta: z.string(),
  titulo: z.string(),
  carpeta: z.string(),
  resumen: z.string().nullable(),
  estado: z.string().nullable(),
  etiquetas: z.array(z.string()),
  actualizadoEn: fecha,
  actualizadoPor: z.string(),
  secretosEnmascarados: z.number(),
  fragmento: z.string().nullable(),
});
export type DocumentoResumen = z.infer<typeof documentoResumenSchema>;

export const documentosPageSchema = z.object({
  items: z.array(documentoResumenSchema),
  page: z.number(),
  pageSize: z.number(),
  totalCount: z.number(),
  totalPages: z.number(),
});
export type DocumentosPage = z.infer<typeof documentosPageSchema>;

const relacionadoSchema = z.object({
  id: z.number(),
  titulo: z.string(),
  ruta: z.string(),
  carpeta: z.string(),
});
export type DocumentoRelacionado = z.infer<typeof relacionadoSchema>;

export const enlaceDocumentoSchema = z.object({
  destino: z.string(),
  seccion: z.string().nullable(),
  textoVisible: z.string().nullable(),
  resuelto: relacionadoSchema.nullable(),
});
export type EnlaceDocumento = z.infer<typeof enlaceDocumentoSchema>;

export const documentoDetalleSchema = z.object({
  id: z.number(),
  ruta: z.string(),
  titulo: z.string(),
  carpeta: z.string(),
  resumen: z.string().nullable(),
  estado: z.string().nullable(),
  contenidoMd: z.string(),
  etiquetas: z.array(z.string()),
  alias: z.array(z.string()),
  enlaces: z.array(enlaceDocumentoSchema),
  enlazadoDesde: z.array(relacionadoSchema),
  versiones: z.array(z.object({ version: z.number(), fecha, usuario: z.string() })),
  version: z.number(),
  secretosEnmascarados: z.number(),
  creadoEn: fecha,
  creadoPor: z.string(),
  actualizadoEn: fecha,
  actualizadoPor: z.string(),
});
export type DocumentoDetalle = z.infer<typeof documentoDetalleSchema>;

export const carpetasSchema = z.array(z.object({ carpeta: z.string(), documentos: z.number() }));
export type CarpetaConteo = z.infer<typeof carpetasSchema>[number];

export const etiquetasKbSchema = z.array(z.object({ nombre: z.string(), documentos: z.number() }));

export const kbEstadoSchema = z.object({
  versionEsquema: z.number(),
  textoCompleto: z.boolean(),
  documentos: z.number(),
});

// ---------------------------------------------------------------- importaciones
export const estadoArchivoSchema = z.enum([
  "Nueva",
  "Actualizada",
  "SinCambios",
  "Omitida",
  "Error",
]);
export type EstadoArchivo = z.infer<typeof estadoArchivoSchema>;

export const archivoInformeSchema = z.object({
  ruta: z.string(),
  estado: estadoArchivoSchema,
  motivo: z.string().nullish(),
  titulo: z.string().nullish(),
  secretosEnmascarados: z.number(),
  lineasConSecretos: z.array(z.number()),
  advertencias: z.array(z.string()),
  enlacesRotos: z.number(),
});
export type ArchivoInforme = z.infer<typeof archivoInformeSchema>;

export const informeImportacionSchema = z.object({
  importacionId: z.number().nullable(),
  total: z.number(),
  nuevas: z.number(),
  actualizadas: z.number(),
  sinCambios: z.number(),
  omitidas: z.number(),
  errores: z.number(),
  conSecretos: z.number(),
  secretosEnmascarados: z.number(),
  enlacesRotos: z.number(),
  archivos: z.array(archivoInformeSchema),
});
export type InformeImportacion = z.infer<typeof informeImportacionSchema>;

export const importacionResumenSchema = z.object({
  importacionId: z.number(),
  usuarioNombre: z.string(),
  usuarioEmail: z.string(),
  origen: z.string(),
  estado: z.string(),
  iniciadaEn: fecha,
  terminadaEn: fecha.nullable(),
  archivos: z.number(),
  nuevos: z.number(),
  actualizados: z.number(),
  sinCambios: z.number(),
  omitidos: z.number(),
  conSecretos: z.number(),
  errores: z.number(),
});
export type ImportacionResumen = z.infer<typeof importacionResumenSchema>;

export const importacionesSchema = z.array(importacionResumenSchema);

export const importacionDetalleSchema = z.object({
  resumen: importacionResumenSchema,
  informe: z.array(archivoInformeSchema).nullable(),
});
