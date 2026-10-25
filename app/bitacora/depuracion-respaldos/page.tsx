import type { Metadata } from "next";
import { Suspense } from "react";
import { GRUPO_DEPURACION_RESPALDOS, obtenerConfigBitacora } from "@/lib/bitacora/grupos";
import { ChecklistView } from "@/modules/bitacora/checklist-view";

export const metadata: Metadata = { title: "Depuración de respaldos" };

export default function DepuracionRespaldosPage() {
  return (
    <Suspense>
      <ChecklistView config={obtenerConfigBitacora(GRUPO_DEPURACION_RESPALDOS)} />
    </Suspense>
  );
}
