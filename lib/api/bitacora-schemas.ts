import { z } from "zod";

// Grupo de bitácora: identifica cuál checklist es. Hoy solo existe la de Actividades (ver backend BitacoraGrupos).
export const GRUPO_ACTIVIDADES_SOFT = "actividades-soft";

export const estadoChecklistSchema = z.enum(["Ok", "Advertencia", "Falla", "Critico", "NoAplica"]);
export type EstadoChecklist = z.infer<typeof estadoChecklistSchema>;

export const actividadBitacoraSchema = z.object({
  actividadId: z.number(),
  grupo: z.string(),
  nombre: z.string(),
  orden: z.number(),
  activa: z.boolean(),
});
export type ActividadBitacora = z.infer<typeof actividadBitacoraSchema>;
export const actividadesBitacoraSchema = z.array(actividadBitacoraSchema);

export const itemChecklistSchema = z.object({
  actividadId: z.number(),
  nombre: z.string(),
  orden: z.number(),
  actividadActiva: z.boolean(),
  estado: estadoChecklistSchema.nullable(),
  observacion: z.string().nullable(),
  revisadoPor: z.string().nullable(),
  revisadoEn: z.string().nullable(),
  actualizadoPor: z.string().nullable(),
  actualizadoEn: z.string().nullable(),
});
export type ItemChecklist = z.infer<typeof itemChecklistSchema>;

export const checklistDiaSchema = z.object({
  grupo: z.string(),
  fecha: z.string(),
  items: z.array(itemChecklistSchema),
});
export type ChecklistDia = z.infer<typeof checklistDiaSchema>;

export const resumenDiaSchema = z.object({
  fecha: z.string(),
  ok: z.number(),
  advertencia: z.number(),
  falla: z.number(),
  critico: z.number(),
  noAplica: z.number(),
  pendiente: z.number(),
  total: z.number(),
});
export type ResumenDia = z.infer<typeof resumenDiaSchema>;
export const resumenDiasSchema = z.array(resumenDiaSchema);
