import type { Metadata } from "next";
import { SubirView } from "@/modules/conocimiento/subir-view";

export const metadata: Metadata = { title: "Subir notas" };

export default function SubirPage() {
  return <SubirView />;
}
