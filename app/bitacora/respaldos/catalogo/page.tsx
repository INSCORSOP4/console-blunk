import type { Metadata } from "next";
import { GRUPO_RESPALDOS, obtenerConfigBitacora } from "@/lib/bitacora/grupos";
import { CatalogoView } from "@/modules/bitacora/catalogo-view";

export const metadata: Metadata = { title: "Catálogo de respaldos" };

export default function CatalogoRespaldosPage() {
  return <CatalogoView config={obtenerConfigBitacora(GRUPO_RESPALDOS)} />;
}
