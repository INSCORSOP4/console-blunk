import { z } from "zod";

export const moduloAuditoriaSchema = z.enum(["Conocimiento", "Microsip", "Bitacora"]);
export type ModuloAuditoria = z.infer<typeof moduloAuditoriaSchema>;

export const eventoAuditoriaSchema = z.object({
  fecha: z.string(),
  modulo: moduloAuditoriaSchema,
  accion: z.string(),
  detalle: z.string().nullable(),
  usuarioNombre: z.string(),
  usuarioEmail: z.string().nullable(),
  resultado: z.string().nullable(),
});
export type EventoAuditoria = z.infer<typeof eventoAuditoriaSchema>;
export const eventosAuditoriaSchema = z.array(eventoAuditoriaSchema);
