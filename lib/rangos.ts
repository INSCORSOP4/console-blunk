import { hoyMx, restarDias, restarMeses } from "./format";

export const PRESETS = [
  { id: "7d", etiqueta: "7 días", agrupacion: "Dia" },
  { id: "30d", etiqueta: "30 días", agrupacion: "Dia" },
  { id: "90d", etiqueta: "90 días", agrupacion: "Semana" },
  { id: "12m", etiqueta: "12 meses", agrupacion: "Mes" },
  { id: "todo", etiqueta: "Todo", agrupacion: "Mes" },
] as const;

export type PresetId = (typeof PRESETS)[number]["id"];
export type Agrupacion = (typeof PRESETS)[number]["agrupacion"];

export function rangoDe(preset: PresetId): { desde?: string; hasta?: string } {
  const hoy = hoyMx();
  switch (preset) {
    case "7d":
      return { desde: restarDias(hoy, 6), hasta: hoy };
    case "30d":
      return { desde: restarDias(hoy, 29), hasta: hoy };
    case "90d":
      return { desde: restarDias(hoy, 89), hasta: hoy };
    case "12m":
      return { desde: restarMeses(hoy, 12), hasta: hoy };
    case "todo":
      return {};
  }
}

export const agrupacionDe = (preset: PresetId): Agrupacion =>
  PRESETS.find((p) => p.id === preset)!.agrupacion;
