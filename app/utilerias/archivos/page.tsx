import type { Metadata } from "next";
import { ArchivosView } from "@/modules/utilerias/archivos-view";

export const metadata: Metadata = { title: "Archivos de confianza" };

export default function ArchivosPage() {
  return <ArchivosView />;
}
