"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiError, apiGet, type Params } from "./client";
import {
  carpetasSchema,
  documentoDetalleSchema,
  documentosPageSchema,
  etiquetasKbSchema,
  importacionDetalleSchema,
  importacionesSchema,
  kbEstadoSchema,
} from "./kb-schemas";
import {
  cargasSchema,
  catalogoSchema,
  conteosSchema,
  historialSchema,
  productividadSchema,
  productividadesSchema,
  productividadTendenciaSchema,
  resumenSchema,
  sesionSchema,
  slaSchema,
  tecnicosSchema,
  tendenciaSchema,
  ticketDetalleSchema,
  ticketsPageSchema,
  tiemposSchema,
} from "./schemas";
import {
  actividadesBitacoraSchema,
  checklistDiaSchema,
  resumenDiasSchema,
} from "./bitacora-schemas";
import { eventosAuditoriaSchema } from "./auditoria-schemas";
import {
  archivosRevisadosSchema,
  cambiosMicrosipSchema,
  jobsResultadoSchema,
  trabajadorFortiaSchema,
  usuariosMicrosipSchema,
} from "./utilerias-schemas";

export type Rango = { desde?: string; hasta?: string };

export const useResumen = (rango: Rango) =>
  useQuery({
    queryKey: ["resumen", rango],
    queryFn: ({ signal }) => apiGet("dashboard/resumen", resumenSchema, rango, signal),
  });

export const useSla = (rango: Rango) =>
  useQuery({
    queryKey: ["sla", rango],
    queryFn: ({ signal }) => apiGet("dashboard/sla", slaSchema, rango, signal),
  });

export const useTendencia = (rango: Rango, agrupacion: "Dia" | "Semana" | "Mes") =>
  useQuery({
    queryKey: ["tendencia", rango, agrupacion],
    queryFn: ({ signal }) =>
      apiGet("dashboard/tendencia", tendenciaSchema, { ...rango, agrupacion }, signal),
    placeholderData: keepPreviousData,
  });

export const useDistribucion = (dimension: string, rango: Rango) =>
  useQuery({
    queryKey: ["distribucion", dimension, rango],
    queryFn: ({ signal }) => apiGet(`dashboard/por-${dimension}`, conteosSchema, rango, signal),
    placeholderData: keepPreviousData,
  });

export const useCargaTecnicos = () =>
  useQuery({
    queryKey: ["tecnicos", "carga"],
    queryFn: ({ signal }) => apiGet("tecnicos/carga", cargasSchema, undefined, signal),
  });

export const useTecnicos = () =>
  useQuery({
    queryKey: ["tecnicos"],
    queryFn: ({ signal }) => apiGet("tecnicos", tecnicosSchema, undefined, signal),
    staleTime: 10 * 60_000,
  });

export const useProductividad = (id: number | null, rango: Rango) =>
  useQuery({
    queryKey: ["tecnicos", id, "productividad", rango],
    queryFn: ({ signal }) =>
      apiGet(`tecnicos/${id}/productividad`, productividadSchema, rango, signal),
    enabled: id !== null,
  });

/** Productividad de todo el equipo en el periodo, para comparar entre técnicos. */
export const useProductividadEquipo = (rango: Rango) =>
  useQuery({
    queryKey: ["tecnicos", "productividad", rango],
    queryFn: ({ signal }) => apiGet("tecnicos/productividad", productividadesSchema, rango, signal),
  });

/** Evolución de la productividad de un técnico por periodo (para ver si va mejorando o empeorando). */
export const useTendenciaProductividad = (
  id: number | null,
  rango: Rango,
  agrupacion: "Dia" | "Semana" | "Mes",
) =>
  useQuery({
    queryKey: ["tecnicos", id, "productividad", "tendencia", rango, agrupacion],
    queryFn: ({ signal }) =>
      apiGet(
        `tecnicos/${id}/productividad/tendencia`,
        productividadTendenciaSchema,
        { ...rango, agrupacion },
        signal,
      ),
    enabled: id !== null,
    placeholderData: keepPreviousData,
  });

export const useTickets = (params: Params) =>
  useQuery({
    queryKey: ["tickets", params],
    queryFn: ({ signal }) => apiGet("tickets", ticketsPageSchema, params, signal),
    placeholderData: keepPreviousData,
  });

export const useTicket = (id: number) =>
  useQuery({
    queryKey: ["ticket", id],
    queryFn: ({ signal }) => apiGet(`tickets/${id}`, ticketDetalleSchema, undefined, signal),
  });

export const useTicketHistorial = (id: number, enabled: boolean) =>
  useQuery({
    queryKey: ["ticket", id, "historial"],
    queryFn: ({ signal }) => apiGet(`tickets/${id}/historial`, historialSchema, undefined, signal),
    enabled,
  });

export const useTicketTiempos = (id: number, enabled: boolean) =>
  useQuery({
    queryKey: ["ticket", id, "tiempos"],
    queryFn: ({ signal }) => apiGet(`tickets/${id}/tiempos`, tiemposSchema, undefined, signal),
    enabled,
  });

export const useCatalogo = (nombre: string) =>
  useQuery({
    queryKey: ["catalogo", nombre],
    queryFn: ({ signal }) => apiGet(`catalogos/${nombre}`, catalogoSchema, undefined, signal),
    staleTime: 30 * 60_000,
  });

/** Usuario de la sesión actual (cookie HttpOnly, consultado vía /api/auth/me). */
export const useSesion = () =>
  useQuery({
    queryKey: ["sesion"],
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/auth/me", { signal });
      if (response.status === 401) {
        // Navegación completa a propósito: reinicia la memoria de la app y la sesión del navegador.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(
          `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
        );
        throw new ApiError("Sesión vencida.", 401);
      }
      if (!response.ok) throw new ApiError("No se pudo consultar la sesión.", response.status);
      return sesionSchema.parse(await response.json());
    },
    staleTime: 5 * 60_000,
    retry: false,
  });

// ---------------------------------------------------------------- base de conocimiento
export const useDocumentos = (params: Params) =>
  useQuery({
    queryKey: ["kb", "documentos", params],
    queryFn: ({ signal }) =>
      apiGet("conocimiento/documentos", documentosPageSchema, params, signal),
    placeholderData: keepPreviousData,
  });

export const useDocumento = (id: number) =>
  useQuery({
    queryKey: ["kb", "documento", id],
    queryFn: ({ signal }) =>
      apiGet(`conocimiento/documentos/${id}`, documentoDetalleSchema, undefined, signal),
  });

export const useCarpetasKb = () =>
  useQuery({
    queryKey: ["kb", "carpetas"],
    queryFn: ({ signal }) => apiGet("conocimiento/carpetas", carpetasSchema, undefined, signal),
  });

export const useEtiquetasKb = () =>
  useQuery({
    queryKey: ["kb", "etiquetas"],
    queryFn: ({ signal }) => apiGet("conocimiento/etiquetas", etiquetasKbSchema, undefined, signal),
  });

export const useKbEstado = () =>
  useQuery({
    queryKey: ["kb", "estado"],
    queryFn: ({ signal }) => apiGet("conocimiento/estado", kbEstadoSchema, undefined, signal),
    retry: false,
  });

export const useImportaciones = (maximo = 50) =>
  useQuery({
    queryKey: ["kb", "importaciones", maximo],
    queryFn: ({ signal }) =>
      apiGet("conocimiento/importaciones", importacionesSchema, { maximo }, signal),
  });

export const useImportacion = (id: number | null) =>
  useQuery({
    queryKey: ["kb", "importacion", id],
    queryFn: ({ signal }) =>
      apiGet(`conocimiento/importaciones/${id}`, importacionDetalleSchema, undefined, signal),
    enabled: id !== null,
  });

export const useJobs = (soloVigilados: boolean, refrescarCada: number | false) =>
  useQuery({
    queryKey: ["utilerias", "jobs", soloVigilados],
    queryFn: ({ signal }) =>
      apiGet("utilerias/jobs", jobsResultadoSchema, { soloVigilados }, signal),
    refetchInterval: refrescarCada,
    placeholderData: keepPreviousData,
  });

export const useUsuariosMicrosip = () =>
  useQuery({
    queryKey: ["utilerias", "microsip", "usuarios"],
    queryFn: ({ signal }) =>
      apiGet("utilerias/microsip/usuarios", usuariosMicrosipSchema, undefined, signal),
  });

/** Trabajador de FORTIA por clave; solo consulta cuando hay una clave ya confirmada (botón Buscar). */
export const useTrabajadorFortia = (clave: number | null) =>
  useQuery({
    queryKey: ["utilerias", "fortia", clave],
    queryFn: ({ signal }) =>
      apiGet(`utilerias/microsip/trabajadores/${clave}`, trabajadorFortiaSchema, undefined, signal),
    enabled: clave !== null,
    retry: (intentos, error) =>
      !(error instanceof ApiError && error.status === 404) && intentos < 2,
    staleTime: 0,
    gcTime: 0,
  });

export const useCambiosMicrosip = (activo: boolean) =>
  useQuery({
    queryKey: ["utilerias", "microsip", "cambios"],
    queryFn: ({ signal }) =>
      apiGet("utilerias/microsip/cambios", cambiosMicrosipSchema, { maximo: 100 }, signal),
    enabled: activo,
  });

/** Catálogo de archivos de confianza (SIA/repbi/olap) con el estado de su última revisión. */
export const useArchivosConfianza = () =>
  useQuery({
    queryKey: ["utilerias", "archivos"],
    queryFn: ({ signal }) => apiGet("utilerias/archivos", archivosRevisadosSchema, {}, signal),
  });

export const useActividadesBitacora = (grupo: string, incluirInactivas = false) =>
  useQuery({
    queryKey: ["bitacora", "actividades", grupo, incluirInactivas],
    queryFn: ({ signal }) =>
      apiGet(
        "bitacora/actividades",
        actividadesBitacoraSchema,
        { grupo, incluirInactivas },
        signal,
      ),
  });

export const useChecklist = (grupo: string, fecha: string) =>
  useQuery({
    queryKey: ["bitacora", "checklist", grupo, fecha],
    queryFn: ({ signal }) =>
      apiGet("bitacora/checklist", checklistDiaSchema, { grupo, fecha }, signal),
  });

export const useResumenBitacora = (grupo: string, desde: string, hasta: string) =>
  useQuery({
    queryKey: ["bitacora", "resumen", grupo, desde, hasta],
    queryFn: ({ signal }) =>
      apiGet("bitacora/resumen", resumenDiasSchema, { grupo, desde, hasta }, signal),
  });

/** Línea de tiempo unificada: Conocimiento, MICROSIP y Bitácora juntos, la más reciente primero. */
export const useAuditoria = (maximo = 150) =>
  useQuery({
    queryKey: ["auditoria", maximo],
    queryFn: ({ signal }) => apiGet("auditoria", eventosAuditoriaSchema, { maximo }, signal),
  });
