import type { Metadata } from "next";
import { Suspense } from "react";
import { GRUPO_ACTIVIDADES_SOFT } from "@/lib/api/bitacora-schemas";
import { obtenerConfigBitacora } from "@/lib/bitacora/grupos";
import { ChecklistView } from "@/modules/bitacora/checklist-view";

export const metadata: Metadata = { title: "Actividades diarias" };

export default function ActividadesBitacoraPage() {
  // La fecha viaja en la URL (?fecha=yyyy-MM-dd), por eso necesita un límite de Suspense.
  return (
    <Suspense>
      <ChecklistView config={obtenerConfigBitacora(GRUPO_ACTIVIDADES_SOFT)} />
    </Suspense>
  );
}
