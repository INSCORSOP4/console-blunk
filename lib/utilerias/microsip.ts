import { problemSchema } from "@/lib/api/schemas";
import {
  usuarioMicrosipSchema,
  type TrabajadorFortia,
  type UsuarioMicrosip,
} from "@/lib/api/utilerias-schemas";

export type FiltroUsuarios = "activos" | "sinClave" | "baja" | "todos";

const sinAcentos = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Un usuario activo al que le falta la clave de FORTIA: es el caso que hay que atender. */
export const sinClave = (u: UsuarioMicrosip) => u.activo && !u.claveFortia;

export function contarUsuarios(usuarios: UsuarioMicrosip[]) {
  const activos = usuarios.filter((u) => u.activo);
  return {
    total: usuarios.length,
    activos: activos.length,
    sinClave: activos.filter((u) => !u.claveFortia).length,
    conClave: activos.filter((u) => u.claveFortia).length,
    baja: usuarios.length - activos.length,
  };
}

/** Filtra por estado y por texto (nombre, clave, empresa, puesto), sin distinguir mayúsculas ni acentos. */
export function filtrarUsuarios(
  usuarios: UsuarioMicrosip[],
  filtro: FiltroUsuarios,
  buscar: string,
): UsuarioMicrosip[] {
  const texto = sinAcentos(buscar.trim());
  return usuarios.filter((u) => {
    if (filtro === "activos" && !u.activo) return false;
    if (filtro === "baja" && u.activo) return false;
    if (filtro === "sinClave" && !sinClave(u)) return false;
    if (!texto) return true;
    return [u.nombre, u.claveFortia, u.nombreUsuario, u.empresa, u.puesto].some((campo) =>
      sinAcentos(campo ?? "").includes(texto),
    );
  });
}

/** Interpreta lo escrito en el campo de clave: solo dígitos, hasta 9, mayor que cero. Si no es válido, null. */
export function parsearClave(texto: string): number | null {
  const limpio = texto.trim();
  if (!/^\d{1,9}$/.test(limpio)) return null;
  const n = Number(limpio);
  return n > 0 ? n : null;
}

/** Otros usuarios (distintos al que se edita) que ya tienen asignada esa clave. */
export function usuariosConClave(
  usuarios: UsuarioMicrosip[],
  clave: number,
  excluirUsuarioId: number,
): UsuarioMicrosip[] {
  return usuarios.filter(
    (u) =>
      u.usuarioId !== excluirUsuarioId && u.claveFortia !== null && Number(u.claveFortia) === clave,
  );
}

export type CampoCambio = { campo: string; antes: string | null; despues: string; cambia: boolean };

/** Qué cambiaría en MICROSIP al guardar los datos del trabajador de FORTIA. */
export function compararConFortia(
  usuario: UsuarioMicrosip,
  trabajador: TrabajadorFortia,
): CampoCambio[] {
  const filas: [string, string | null, string][] = [
    ["Clave de FORTIA", usuario.claveFortia, String(trabajador.clave)],
    ["Nombre", usuario.nombreUsuario, trabajador.nombreCompleto],
    ["Empresa", usuario.empresa, trabajador.empresa],
    ["Puesto", usuario.puesto, trabajador.puesto],
  ];
  return filas.map(([campo, antes, despues]) => ({
    campo,
    antes,
    despues,
    cambia: (antes ?? "") !== despues,
  }));
}

/** Límites de las columnas de MICROSIP (la API los vuelve a comprobar). */
export const LIMITES = { empresa: 50, nombre: 100, puesto: 100 } as const;

export function excedeLimites(trabajador: TrabajadorFortia): string[] {
  const avisos: string[] = [];
  if (trabajador.nombreCompleto.length > LIMITES.nombre) avisos.push("El nombre");
  if (trabajador.empresa.length > LIMITES.empresa) avisos.push("La empresa");
  if (trabajador.puesto.length > LIMITES.puesto) avisos.push("El puesto");
  return avisos;
}

export class ErrorGuardado extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ErrorGuardado";
  }
}

/** Guarda la clave de FORTIA del usuario. El resto de los datos los toma la API de FORTIA, no de aquí. */
export async function guardarClaveFortia(
  usuarioId: number,
  claveFortia: number,
): Promise<UsuarioMicrosip> {
  let response: Response;
  try {
    response = await fetch(`/api/utilerias/microsip/usuarios/${usuarioId}/datos-adicionales`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ claveFortia }),
    });
  } catch {
    throw new ErrorGuardado("No hay conexión con el servidor. No se guardó nada.", 0);
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
    throw new ErrorGuardado(mensaje, response.status);
  }
  const usuario = usuarioMicrosipSchema.safeParse(cuerpo);
  if (!usuario.success)
    throw new ErrorGuardado("La respuesta del servidor no tiene el formato esperado.", 502);
  return usuario.data;
}
