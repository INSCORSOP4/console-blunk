import type { Metadata } from "next";
import { GRUPO_DEPURACION_RESPALDOS, obtenerConfigBitacora } from "@/lib/bitacora/grupos";
import { CatalogoView } from "@/modules/bitacora/catalogo-view";

export const metadata: Metadata = { title: "Catálogo de depuración de respaldos" };

export default function CatalogoDepuracionRespaldosPage() {
  return <CatalogoView config={obtenerConfigBitacora(GRUPO_DEPURACION_RESPALDOS)} />;
}
