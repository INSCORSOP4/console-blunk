import { problemSchema } from "@/lib/api/schemas";
import {
  actividadBitacoraSchema,
  itemChecklistSchema,
  type ActividadBitacora,
  type EstadoChecklist,
  type ItemChecklist,
} from "@/lib/api/bitacora-schemas";

export class ErrorBitacora extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ErrorBitacora";
  }
}

async function enviar<
  S extends { safeParse: (v: unknown) => { success: boolean; data?: unknown } },
>(
  url: string,
  metodo: "POST" | "PUT",
  body: unknown,
  schema: S,
): Promise<ReturnType<S["safeParse"]> extends { data?: infer D } ? D : never> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: metodo,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ErrorBitacora("No hay conexión con el servidor. No se guardó nada.", 0);
  }

  const cuerpo: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const p = problemSchema.safeParse(cuerpo);
    const detalle = p.success
      ? (p.data.detail ??
        (p.data.errors ? Object.values(p.data.errors).flat().join(" ") : undefined) ??
        p.data.title)
      : undefined;
    const mensaje =
      response.status === 401
        ? "Tu sesión expiró. Inicia sesión de nuevo."
        : response.status === 429
          ? "Demasiados cambios seguidos. Espera un minuto."
          : (detalle ?? `No se pudo guardar (error ${response.status}).`);
    throw new ErrorBitacora(mensaje, response.status);
  }

  const parsed = schema.safeParse(cuerpo);
  if (!parsed.success)
    throw new ErrorBitacora("La respuesta del servidor no tiene el formato esperado.", 502);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return parsed.data as any;
}

export const guardarEstado = (
  actividadId: number,
  fecha: string,
  estado: EstadoChecklist,
  observacion: string,
): Promise<ItemChecklist> =>
  enviar(
    `/api/bitacora/checklist/${actividadId}?fecha=${fecha}`,
    "PUT",
    { estado, observacion: observacion.trim() || null },
    itemChecklistSchema,
  );

export const crearActividad = (grupo: string, nombre: string): Promise<ActividadBitacora> =>
  enviar("/api/bitacora/actividades", "POST", { grupo, nombre }, actividadBitacoraSchema);

export const actualizarActividad = (
  actividadId: number,
  cambios: { nombre?: string; activa?: boolean; orden?: number },
): Promise<ActividadBitacora> =>
  enviar(`/api/bitacora/actividades/${actividadId}`, "PUT", cambios, actividadBitacoraSchema);
