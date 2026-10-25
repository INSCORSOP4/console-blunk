import type { Metadata } from "next";
import { ImportacionesView } from "@/modules/conocimiento/importaciones-view";

export const metadata: Metadata = { title: "Bitácora de subidas" };

export default function ImportacionesPage() {
  return <ImportacionesView />;
}
