import type { NextRequest } from "next/server";
import { reenviarEscritura } from "@/lib/bitacora/proxy-escritura";

// Guarda el estado (y observación) de una actividad en una fecha. La fecha viaja en la query, igual que en la API.
export async function PUT(request: NextRequest, ctx: RouteContext<"/api/bitacora/checklist/[id]">) {
  const { id } = await ctx.params;
  if (!/^\d{1,9}$/.test(id))
    return Response.json({ title: "Actividad no válida", status: 400 }, { status: 400 });

  const fecha = request.nextUrl.searchParams.get("fecha") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha))
    return Response.json({ title: "Falta la fecha (yyyy-MM-dd).", status: 400 }, { status: 400 });

  return reenviarEscritura(request, {
    metodo: "PUT",
    destino: `bitacora/checklist/${id}?fecha=${fecha}`,
    maxBytes: 2_000,
    valido: (cuerpo) =>
      typeof cuerpo === "object" &&
      cuerpo !== null &&
      typeof (cuerpo as Record<string, unknown>).estado === "string",
  });
}
