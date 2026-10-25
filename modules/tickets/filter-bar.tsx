"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/shared/filter-select";
import { useCatalogo, useTecnicos } from "@/lib/api/queries";
import { nombreEstado } from "@/components/shared/status-badge";
import type { TicketFilters } from "./use-ticket-filters";

type Props = {
  filters: TicketFilters;
  activos: number;
  onChange: (patch: Partial<TicketFilters>) => void;
  onReset: () => void;
};

export function FilterBar({ filters, activos, onChange, onReset }: Props) {
  const estados = useCatalogo("estados");
  const grupos = useCatalogo("grupos");
  const categorias = useCatalogo("categorias");
  const prioridades = useCatalogo("prioridades");
  const tecnicos = useTecnicos();

  // El texto se escribe en local y se aplica a la URL tras una pausa para no consultar en cada tecla.
  const [texto, setTexto] = useState(filters.buscar);
  const [previo, setPrevio] = useState(filters.buscar);
  if (filters.buscar !== previo) {
    setPrevio(filters.buscar);
    setTexto(filters.buscar);
  }
  useEffect(() => {
    if (texto === filters.buscar) return;
    const t = setTimeout(() => onChange({ buscar: texto.trim() }), 400);
    return () => clearTimeout(t);
  }, [texto, filters.buscar, onChange]);

  return (
    <section
      aria-label="Filtros"
      className="rise bg-card mb-5 rounded-xl border p-4"
      style={{ "--i": 1 } as React.CSSProperties}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="eyebrow">Buscar por título o número</span>
          <span className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ej. correo, VPN, 16506…"
              maxLength={200}
              className="pl-8"
            />
          </span>
        </label>

        <FilterSelect
          label="Estado"
          value={filters.estadoId}
          onChange={(v) => onChange({ estadoId: v })}
          loading={estados.isPending}
          options={(estados.data ?? []).map((e) => ({
            value: String(e.id),
            label: nombreEstado(e.id, e.nombre),
          }))}
        />
        <FilterSelect
          label="Técnico"
          value={filters.tecnicoId}
          onChange={(v) => onChange({ tecnicoId: v })}
          loading={tecnicos.isPending}
          options={(tecnicos.data ?? []).map((t) => ({ value: String(t.id), label: t.nombre }))}
        />
        <FilterSelect
          label="Grupo"
          value={filters.grupoId}
          onChange={(v) => onChange({ grupoId: v })}
          loading={grupos.isPending}
          options={(grupos.data ?? []).map((g) => ({ value: String(g.id), label: g.nombre }))}
        />
        <FilterSelect
          label="Categoría"
          value={filters.categoriaId}
          onChange={(v) => onChange({ categoriaId: v })}
          loading={categorias.isPending}
          options={(categorias.data ?? []).map((c) => ({ value: String(c.id), label: c.nombre }))}
        />
        <FilterSelect
          label="Prioridad"
          value={filters.prioridadId}
          onChange={(v) => onChange({ prioridadId: v })}
          loading={prioridades.isPending}
          options={(prioridades.data ?? []).map((p) => ({ value: String(p.id), label: p.nombre }))}
        />
        <FilterSelect
          label="SLA"
          value={filters.vencido}
          onChange={(v) => onChange({ vencido: v })}
          allLabel="Todos"
          options={[{ value: "true", label: "Solo vencidos" }]}
        />
        <FilterSelect
          label="Respuesta"
          value={filters.sinResponder}
          onChange={(v) => onChange({ sinResponder: v })}
          allLabel="Todos"
          options={[{ value: "true", label: "Sin responder" }]}
        />

        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">Creado desde</span>
          <Input
            type="date"
            value={filters.desde}
            max={filters.hasta || undefined}
            onChange={(e) => onChange({ desde: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">Creado hasta</span>
          <Input
            type="date"
            value={filters.hasta}
            min={filters.desde || undefined}
            onChange={(e) => onChange({ hasta: e.target.value })}
          />
        </label>
      </div>

      {activos > 0 && (
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <p className="text-muted-foreground font-mono text-xs">
            {activos} {activos === 1 ? "filtro activo" : "filtros activos"}
          </p>
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X /> Limpiar filtros
          </Button>
        </div>
      )}
    </section>
  );
}
