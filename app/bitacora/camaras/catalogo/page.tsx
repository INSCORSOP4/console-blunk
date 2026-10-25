import type { Metadata } from "next";
import { GRUPO_CAMARAS, obtenerConfigBitacora } from "@/lib/bitacora/grupos";
import { CatalogoView } from "@/modules/bitacora/catalogo-view";

export const metadata: Metadata = { title: "Catálogo de cámaras" };

export default function CatalogoCamarasPage() {
  return <CatalogoView config={obtenerConfigBitacora(GRUPO_CAMARAS)} />;
}
