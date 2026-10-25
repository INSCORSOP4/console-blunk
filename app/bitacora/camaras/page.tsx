import type { Metadata } from "next";
import { Suspense } from "react";
import { GRUPO_CAMARAS, obtenerConfigBitacora } from "@/lib/bitacora/grupos";
import { ChecklistView } from "@/modules/bitacora/checklist-view";

export const metadata: Metadata = { title: "Cámaras" };

export default function CamarasBitacoraPage() {
  return (
    <Suspense>
      <ChecklistView config={obtenerConfigBitacora(GRUPO_CAMARAS)} />
    </Suspense>
  );
}
