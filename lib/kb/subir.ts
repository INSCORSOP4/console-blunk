import { informeImportacionSchema, type InformeImportacion } from "@/lib/api/kb-schemas";
import { problemSchema } from "@/lib/api/schemas";

export const URL_SUBIDA = "/api/conocimiento/importaciones";

export class ErrorDeSubida extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ErrorDeSubida";
  }
}

export type SubidaEnCurso = { resultado: Promise<InformeImportacion>; cancelar: () => void };

/** Mensaje comprensible para el error HTTP de una subida. */
export function mensajeDeError(status: number, cuerpo: unknown): string {
  const problema = problemSchema.safeParse(cuerpo);
  const detalle = problema.success ? (problema.data.detail ?? problema.data.title) : undefined;
  switch (status) {
    case 401:
      return "Tu sesión expiró. Inicia sesión de nuevo.";
    case 413:
      return "La subida supera el tamaño máximo permitido (60 MB). Sube menos archivos a la vez.";
    case 429:
      return "Hiciste demasiadas subidas seguidas. Espera un minuto e inténtalo de nuevo.";
    case 503:
      return detalle ?? "La base de conocimiento no está disponible en este momento.";
    default:
      return detalle ?? `No se pudo completar la subida (error ${status}).`;
  }
}

/**
 * Sube el formulario con XMLHttpRequest (fetch no informa el avance de la subida).
 * Devuelve el informe validado o lanza ErrorDeSubida con un mensaje listo para mostrar.
 */
export function subirNotas(form: FormData, alAvanzar: (porcentaje: number) => void): SubidaEnCurso {
  const xhr = new XMLHttpRequest();

  const resultado = new Promise<InformeImportacion>((resolve, reject) => {
    xhr.open("POST", URL_SUBIDA);
    xhr.responseType = "text";
    xhr.timeout = 5 * 60_000;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) alAvanzar(Math.min(99, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onerror = () =>
      reject(
        new ErrorDeSubida(
          "No hay conexión con el servidor. Revisa tu red e inténtalo de nuevo.",
          0,
        ),
      );
    xhr.ontimeout = () => reject(new ErrorDeSubida("La subida tardó demasiado y se canceló.", 0));
    xhr.onabort = () => reject(new ErrorDeSubida("Subida cancelada.", 0));
    xhr.onload = () => {
      let cuerpo: unknown = null;
      try {
        cuerpo = JSON.parse(xhr.responseText);
      } catch {
        /* respuesta sin JSON: se informa solo el estado */
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        const informe = informeImportacionSchema.safeParse(cuerpo);
        if (informe.success) {
          alAvanzar(100);
          resolve(informe.data);
        } else {
          reject(new ErrorDeSubida("La respuesta del servidor no tiene el formato esperado.", 502));
        }
        return;
      }
      reject(new ErrorDeSubida(mensajeDeError(xhr.status, cuerpo), xhr.status));
    };

    xhr.send(form);
  });

  return { resultado, cancelar: () => xhr.abort() };
}
