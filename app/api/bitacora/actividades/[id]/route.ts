import type { NextRequest } from "next/server";
import { reenviarEscritura } from "@/lib/bitacora/proxy-escritura";

// Renombra, activa/desactiva o reordena una actividad del catálogo.
export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/bitacora/actividades/[id]">,
) {
  const { id } = await ctx.params;
  if (!/^\d{1,9}$/.test(id))
    return Response.json({ title: "Actividad no válida", status: 400 }, { status: 400 });

  return reenviarEscritura(request, {
    metodo: "PUT",
    destino: `bitacora/actividades/${id}`,
    maxBytes: 2_000,
    valido: (cuerpo) => typeof cuerpo === "object" && cuerpo !== null,
  });
}
