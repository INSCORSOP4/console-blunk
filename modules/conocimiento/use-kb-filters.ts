"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { Params } from "@/lib/api/client";

export const KB_PAGE_SIZE = 15;
export type OrdenKb = "Recientes" | "Titulo";

export type KbFilters = {
  buscar: string;
  carpeta: string;
  etiqueta: string;
  orden: OrdenKb;
  page: number;
};

/** Filtros de la base de conocimiento: viven en la URL (se pueden compartir) y se validan antes de usarse. */
export function useKbFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const filters = useMemo<KbFilters>(() => {
    const get = (k: string) => search.get(k) ?? "";
    const page = Number.parseInt(get("page"), 10);
    return {
      buscar: get("buscar").slice(0, 200),
      carpeta: get("carpeta").slice(0, 450),
      etiqueta: get("etiqueta").slice(0, 100),
      orden: get("orden") === "Titulo" ? "Titulo" : "Recientes",
      page: Number.isInteger(page) && page > 0 ? page : 1,
    };
  }, [search]);

  const setFilters = useCallback(
    (patch: Partial<KbFilters>) => {
      const next: KbFilters = { ...filters, ...patch };
      if (!("page" in patch)) next.page = 1; // cambiar un filtro reinicia la paginación

      const qs = new URLSearchParams();
      if (next.buscar) qs.set("buscar", next.buscar);
      if (next.carpeta) qs.set("carpeta", next.carpeta);
      if (next.etiqueta) qs.set("etiqueta", next.etiqueta);
      if (next.orden !== "Recientes") qs.set("orden", next.orden);
      if (next.page > 1) qs.set("page", String(next.page));
      const text = qs.toString();
      router.replace(text ? `${pathname}?${text}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  const reset = useCallback(() => router.replace(pathname, { scroll: false }), [pathname, router]);
  const activos = [filters.buscar, filters.carpeta, filters.etiqueta].filter(Boolean).length;

  const paramsApi: Params = useMemo(
    () => ({
      buscar: filters.buscar,
      carpeta: filters.carpeta,
      etiqueta: filters.etiqueta,
      orden: filters.orden,
      page: filters.page,
      pageSize: KB_PAGE_SIZE,
    }),
    [filters],
  );

  return { filters, setFilters, reset, activos, paramsApi };
}
