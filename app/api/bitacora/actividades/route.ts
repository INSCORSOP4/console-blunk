import type { NextRequest } from "next/server";
import { reenviarEscritura } from "@/lib/bitacora/proxy-escritura";

// Crea una actividad del catálogo de una bitácora (hoy solo "actividades-soft").
export async function POST(request: NextRequest) {
  return reenviarEscritura(request, {
    metodo: "POST",
    destino: "bitacora/actividades",
    maxBytes: 2_000,
    valido: (cuerpo) =>
      typeof cuerpo === "object" &&
      cuerpo !== null &&
      typeof (cuerpo as Record<string, unknown>).grupo === "string" &&
      typeof (cuerpo as Record<string, unknown>).nombre === "string",
  });
}
