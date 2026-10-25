import { z } from "zod";

// Fechas: la API las entrega como ISO con offset de México (p. ej. 2026-10-05T15:56:49-06:00).
const fecha = z.string().nullable();

export const conteoSchema = z.object({
  id: z.number().nullable(),
  nombre: z.string(),
  total: z.number(),
});
export type Conteo = z.infer<typeof conteoSchema>;

export const resumenSchema = z.object({
  total: z.number(),
  abiertos: z.number(),
  cerrados: z.number(),
  vencidos: z.number(),
  creadosHoy: z.number(),
  cerradosHoy: z.number(),
  sinAsignar: z.number(),
  promedioHorasResolucion: z.number().nullable(),
  porEstado: z.array(conteoSchema),
});
export type Resumen = z.infer<typeof resumenSchema>;

export const tendenciaSchema = z.array(
  z.object({ periodo: z.string(), creados: z.number(), cerrados: z.number() }),
);
export type TendenciaPunto = z.infer<typeof tendenciaSchema>[number];

export const slaSchema = z.object({
  total: z.number(),
  vencidos: z.number(),
  enTiempo: z.number(),
  porcentajeCumplimiento: z.number(),
});
export type Sla = z.infer<typeof slaSchema>;

export const conteosSchema = z.array(conteoSchema);

export const ticketResumenSchema = z.object({
  id: z.number(),
  titulo: z.string(),
  estadoId: z.number(),
  estado: z.string(),
  prioridad: z.string().nullable(),
  categoria: z.string().nullable(),
  grupo: z.string().nullable(),
  tecnicoId: z.number().nullable(),
  tecnico: z.string().nullable(),
  solicitante: z.string().nullable(),
  vencido: z.boolean(),
  creado: fecha,
  vence: fecha,
  completado: fecha,
});
export type TicketResumen = z.infer<typeof ticketResumenSchema>;

export const ticketsPageSchema = z.object({
  items: z.array(ticketResumenSchema),
  page: z.number(),
  pageSize: z.number(),
  totalCount: z.number(),
  totalPages: z.number(),
});
export type TicketsPage = z.infer<typeof ticketsPageSchema>;

export const ticketDetalleSchema = z.object({
  resumen: ticketResumenSchema,
  descripcion: z.string().nullable(),
  resolucion: z.string().nullable(),
  subcategoria: z.string().nullable(),
  item: z.string().nullable(),
  urgencia: z.string().nullable(),
  impacto: z.string().nullable(),
  modo: z.string().nullable(),
  tipoSolicitud: z.string().nullable(),
  nivel: z.string().nullable(),
  departamento: z.string().nullable(),
  reabierto: z.boolean(),
  respondido: fecha,
  resuelto: fecha,
});
export type TicketDetalle = z.infer<typeof ticketDetalleSchema>;

export const historialSchema = z.array(
  z.object({
    id: z.number(),
    fecha,
    operacion: z.string().nullable(),
    descripcion: z.string().nullable(),
    usuario: z.string().nullable(),
  }),
);
export type HistorialItem = z.infer<typeof historialSchema>[number];

const tiempo = { fin: fecha, tiempoRegistrado: z.number() };
export const tiemposSchema = z.object({
  porEstado: z.array(z.object({ estado: z.string(), ...tiempo })),
  porTecnico: z.array(z.object({ tecnico: z.string().nullable(), ...tiempo })),
  porGrupo: z.array(z.object({ grupo: z.string().nullable(), ...tiempo })),
});
export type Tiempos = z.infer<typeof tiemposSchema>;

export const tecnicosSchema = z.array(z.object({ id: z.number(), nombre: z.string() }));
export type Tecnico = z.infer<typeof tecnicosSchema>[number];

export const cargaSchema = z.object({
  tecnicoId: z.number(),
  tecnico: z.string(),
  abiertos: z.number(),
  vencidos: z.number(),
  total: z.number(),
});
export const cargasSchema = z.array(cargaSchema);
export type Carga = z.infer<typeof cargaSchema>;

export const productividadSchema = z.object({
  tecnicoId: z.number(),
  tecnico: z.string(),
  asignados: z.number(),
  cerrados: z.number(),
  vencidos: z.number(),
  cumplimientoSlaPct: z.number(),
  promedioHorasPrimeraRespuesta: z.number().nullable(),
  promedioHorasResolucion: z.number().nullable(),
});
export type Productividad = z.infer<typeof productividadSchema>;
export const productividadesSchema = z.array(productividadSchema);

export const productividadTendenciaSchema = z.array(
  z.object({
    periodo: z.string(),
    asignados: z.number(),
    cerrados: z.number(),
    cumplimientoSlaPct: z.number(),
    promedioHorasPrimeraRespuesta: z.number().nullable(),
    promedioHorasResolucion: z.number().nullable(),
  }),
);
export type ProductividadPunto = z.infer<typeof productividadTendenciaSchema>[number];

export const catalogoSchema = z.array(
  z.object({ id: z.number(), nombre: z.string(), padreId: z.number().nullable() }),
);
export type CatalogoItem = z.infer<typeof catalogoSchema>[number];

export const sesionSchema = z.object({ id: z.string(), nombre: z.string(), email: z.string() });
export type Sesion = z.infer<typeof sesionSchema>;

export const problemSchema = z.object({
  title: z.string().optional(),
  detail: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});
