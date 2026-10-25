import type { Metadata } from "next";
import { Suspense } from "react";
import { GRUPO_RESPALDOS, obtenerConfigBitacora } from "@/lib/bitacora/grupos";
import { ChecklistView } from "@/modules/bitacora/checklist-view";

export const metadata: Metadata = { title: "Respaldos" };

export default function RespaldosBitacoraPage() {
  return (
    <Suspense>
      <ChecklistView config={obtenerConfigBitacora(GRUPO_RESPALDOS)} />
    </Suspense>
  );
}
