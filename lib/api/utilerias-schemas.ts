import { z } from "zod";

// Estado de un job o de un paso de SQL Server Agent (la API serializa el enum como texto).
export const estadoJobSchema = z.enum([
  "SinHistorial",
  "Fallido",
  "Exitoso",
  "Reintento",
  "Cancelado",
  "EnEjecucion",
]);
export type EstadoJob = z.infer<typeof estadoJobSchema>;

export const jobPasoSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  estado: estadoJobSchema,
  ultimaEjecucion: z.string().nullable(),
  duracionSegundos: z.number().nullable(),
  mensaje: z.string().nullable(),
});
export type JobPaso = z.infer<typeof jobPasoSchema>;

export const jobResumenSchema = z.object({
  nombre: z.string(),
  habilitado: z.boolean(),
  estado: estadoJobSchema,
  ultimaEjecucion: z.string().nullable(),
  duracionSegundos: z.number().nullable(),
  siguienteEjecucion: z.string().nullable(),
  pasoEnEjecucion: z.number().nullable(),
  pasos: z.array(jobPasoSchema),
});
export type JobResumen = z.infer<typeof jobResumenSchema>;

export const jobsResultadoSchema = z.object({
  soloVigilados: z.boolean(),
  noEncontrados: z.array(z.string()),
  jobs: z.array(jobResumenSchema),
  consultadoEn: z.string(),
});
export type JobsResultado = z.infer<typeof jobsResultadoSchema>;

// ---------------------------------------------------------------- Usuarios MICROSIP + FORTIA
export const usuarioMicrosipSchema = z.object({
  usuarioId: z.number(),
  nombre: z.string(),
  estatus: z.string(),
  activo: z.boolean(),
  claveFortia: z.string().nullable(),
  nombreUsuario: z.string().nullable(),
  empresa: z.string().nullable(),
  puesto: z.string().nullable(),
  tieneDatosAdicionales: z.boolean(),
});
export type UsuarioMicrosip = z.infer<typeof usuarioMicrosipSchema>;
export const usuariosMicrosipSchema = z.array(usuarioMicrosipSchema);

export const trabajadorFortiaSchema = z.object({
  clave: z.number(),
  nombreCompleto: z.string(),
  empresa: z.string(),
  puesto: z.string(),
});
export type TrabajadorFortia = z.infer<typeof trabajadorFortiaSchema>;

export const cambioMicrosipSchema = z.object({
  id: z.number(),
  fecha: z.string(),
  usuarioEmail: z.string(),
  usuarioNombre: z.string(),
  microsipUsuarioId: z.number(),
  microsipNombre: z.string(),
  accion: z.enum(["Insertar", "Actualizar"]),
  resultado: z.enum(["Pendiente", "Aplicado", "Fallido", "NoVerificado"]),
  antes: z.string().nullable(),
  despues: z.string(),
  error: z.string().nullable(),
});
export type CambioMicrosip = z.infer<typeof cambioMicrosipSchema>;
export const cambiosMicrosipSchema = z.array(cambioMicrosipSchema);

// ---------------------------------------------------------------- Archivos de confianza
export const estadoArchivoSchema = z.enum([
  "Actualizado",
  "Desactualizado",
  "Faltante",
  "Error",
  "SinRevisar",
]);
export type EstadoArchivo = z.infer<typeof estadoArchivoSchema>;

export const archivoRevisadoSchema = z.object({
  archivoId: z.number(),
  ruta: z.string(),
  nombreArchivo: z.string(),
  fecha: z.string().nullable(),
  estado: estadoArchivoSchema,
  ultimaModificacion: z.string().nullable(),
  detalle: z.string().nullable(),
  revisadoEn: z.string().nullable(),
});
export type ArchivoRevisado = z.infer<typeof archivoRevisadoSchema>;
export const archivosRevisadosSchema = z.array(archivoRevisadoSchema);
