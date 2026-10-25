import type { Metadata } from "next";
import { TecnicosView } from "@/modules/tecnicos/tecnicos-view";

export const metadata: Metadata = { title: "Técnicos" };

export default function TecnicosPage() {
  return <TecnicosView />;
}
