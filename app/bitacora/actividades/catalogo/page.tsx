import type { Metadata } from "next";
import { GRUPO_ACTIVIDADES_SOFT } from "@/lib/api/bitacora-schemas";
import { obtenerConfigBitacora } from "@/lib/bitacora/grupos";
import { CatalogoView } from "@/modules/bitacora/catalogo-view";

export const metadata: Metadata = { title: "Catálogo de actividades" };

export default function CatalogoActividadesPage() {
  return <CatalogoView config={obtenerConfigBitacora(GRUPO_ACTIVIDADES_SOFT)} />;
}
