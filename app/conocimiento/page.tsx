import type { Metadata } from "next";
import { Suspense } from "react";
import { ConocimientoView } from "@/modules/conocimiento/conocimiento-view";

export const metadata: Metadata = { title: "Conocimiento" };

export default function ConocimientoPage() {
  // useSearchParams (filtros en la URL) exige un límite de Suspense.
  return (
    <Suspense>
      <ConocimientoView />
    </Suspense>
  );
}
