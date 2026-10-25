"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { Params } from "@/lib/api/client";

export const ORDENES = ["CreadoDesc", "CreadoAsc", "VenceAsc", "IdDesc"] as const;
export type Orden = (typeof ORDENES)[number];

export const PAGE_SIZE = 25;

export type TicketFilters = {
  buscar: string;
  estadoId: string;
  tecnicoId: string;
  grupoId: string;
  categoriaId: string;
  prioridadId: string;
  desde: string;
  hasta: string;
  vencido: string;
  sinResponder: string;
  orden: Orden;
  page: number;
};

const FILTER_KEYS = [
  "buscar",
  "estadoId",
  "tecnicoId",
  "grupoId",
  "categoriaId",
  "prioridadId",
  "desde",
  "hasta",
  "vencido",
  "sinResponder",
] as const;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^\d+$/;

/** Lee los filtros de la URL (fuente de verdad) validando cada valor para no mandar basura a la API. */
export function useTicketFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const filters = useMemo<TicketFilters>(() => {
    const get = (k: string) => search.get(k) ?? "";
    const id = (k: string) => (ID.test(get(k)) ? get(k) : "");
    const fecha = (k: string) => (FECHA.test(get(k)) ? get(k) : "");
    const orden = ORDENES.find((o) => o === get("orden")) ?? "CreadoDesc";
    const page = Number.parseInt(get("page"), 10);
    return {
      buscar: get("buscar").slice(0, 200),
      estadoId: id("estadoId"),
      tecnicoId: id("tecnicoId"),
      grupoId: id("grupoId"),
      categoriaId: id("categoriaId"),
      prioridadId: id("prioridadId"),
      desde: fecha("desde"),
      hasta: fecha("hasta"),
      vencido: get("vencido") === "true" ? "true" : "",
      sinResponder: get("sinResponder") === "true" ? "true" : "",
      orden,
      page: Number.isInteger(page) && page > 0 ? page : 1,
    };
  }, [search]);

  const setFilters = useCallback(
    (patch: Partial<TicketFilters>) => {
      const next: TicketFilters = { ...filters, ...patch };
      // Cualquier cambio de filtro u orden reinicia la paginación, salvo que se pida una página explícita.
      if (!("page" in patch)) next.page = 1;

      const qs = new URLSearchParams();
      for (const key of FILTER_KEYS) if (next[key]) qs.set(key, next[key]);
      if (next.orden !== "CreadoDesc") qs.set("orden", next.orden);
      if (next.page > 1) qs.set("page", String(next.page));
      const text = qs.toString();
      router.replace(text ? `${pathname}?${text}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  const reset = useCallback(() => router.replace(pathname, { scroll: false }), [pathname, router]);

  const activos = FILTER_KEYS.filter((k) => filters[k]).length;

  /** Parámetros para la API (sin paginación). */
  const filtrosApi: Params = useMemo(
    () => ({
      buscar: filters.buscar,
      estadoId: filters.estadoId,
      tecnicoId: filters.tecnicoId,
      grupoId: filters.grupoId,
      categoriaId: filters.categoriaId,
      prioridadId: filters.prioridadId,
      desde: filters.desde,
      hasta: filters.hasta,
      vencido: filters.vencido,
      sinResponder: filters.sinResponder,
    }),
    [filters],
  );

  return { filters, setFilters, reset, activos, filtrosApi };
}
